import datetime
from sqlalchemy import func
from models import db
from models.medicine import Medicine
from models.sale import Sale
from models.order import Order, OrderItem
from models.purchase import Purchase
from models.batch import MedicineBatch

class DeadStockAnalyzer:
    """
    A service class responsible for identifying slow-moving and dead stock.
    It analyzes historical sales, online orders, current stock levels, and batch expiry dates
    to classify inventory into categories like 'DEAD STOCK', 'SLOW MOVING', or 'EXPIRY RISK'.
    """
    def __init__(self, db_session):
        self.db = db_session
        
        # Define configurable thresholds for operational analytics
        self.OBSERVATION_WINDOW_DAYS = 90  # Look at the last 90 days of demand
        self.POTENTIAL_DEAD_STOCK_DAYS = 60 # Flag as slow if no sales in 60 days
        self.DEAD_STOCK_NO_SALE_DAYS = 90  # Flag as dead if no sales in 90 days
        self.NEW_PRODUCT_DAYS = 30         # Grace period for newly added items with 0 sales
        
    def analyze_dead_stock(self):
        """
        Main method to perform dead stock classification for all medicines.
        Returns a dictionary containing a summary of the risks and a detailed list of items.
        """
        today = datetime.datetime.utcnow()
        observation_start = today - datetime.timedelta(days=self.OBSERVATION_WINDOW_DAYS)
        
        # 1. Fetch all medicines
        medicines = self.db.query(Medicine).all()
        if not medicines:
            return {"summary": {}, "items": []}
            
        # 2. Fetch POS Sales from the last 90 days
        recent_sales = self.db.query(
            Sale.medicine_id,
            func.sum(Sale.quantity).label('total_qty'),
            func.max(Sale.date).label('last_sale_date')
        ).filter(Sale.date >= observation_start)\
         .group_by(Sale.medicine_id).all()
         
        # 3. Fetch Online Orders from the last 90 days
        # We only count valid, fulfilled/completed orders (excluding cancelled/rejected)
        # to ensure we calculate true demand.
        recent_orders = self.db.query(
            OrderItem.medicine_id,
            func.sum(OrderItem.quantity).label('total_qty'),
            func.max(Order.order_date).label('last_sale_date')
        ).join(Order, OrderItem.order_id == Order.order_id)\
         .filter(Order.order_date >= observation_start)\
         .filter(Order.status.not_in(['Cancelled', 'Rejected']))\
         .group_by(OrderItem.medicine_id).all()
         
        # 4. Fetch the absolute all-time last sale date for medicines.
        # This helps us identify products that haven't sold in the 90-day window,
        # but did sell at some point in the distant past.
        all_time_last_pos = self.db.query(
            Sale.medicine_id,
            func.max(Sale.date).label('last_sale_date')
        ).group_by(Sale.medicine_id).all()
        
        all_time_last_order = self.db.query(
            OrderItem.medicine_id,
            func.max(Order.order_date).label('last_sale_date')
        ).join(Order, OrderItem.order_id == Order.order_id)\
         .filter(Order.status.not_in(['Cancelled', 'Rejected']))\
         .group_by(OrderItem.medicine_id).all()

        # Combine all-time last sale dates
        last_sale_map = {}
        for row in all_time_last_pos:
            last_sale_map[row.medicine_id] = row.last_sale_date
            
        for row in all_time_last_order:
            existing = last_sale_map.get(row.medicine_id)
            if not existing or row.last_sale_date > existing:
                last_sale_map[row.medicine_id] = row.last_sale_date

        # 6. Combine the POS and Online Order quantities to find the total 90-day demand
        demand_map = {}
        for row in recent_sales:
            demand_map[row.medicine_id] = demand_map.get(row.medicine_id, 0) + row.total_qty
            
        for row in recent_orders:
            demand_map[row.medicine_id] = demand_map.get(row.medicine_id, 0) + row.total_qty
            
        # 7. Fetch the most recent cost price for each medicine
        # This is used to calculate the "Value At Risk" (Capital tied up in dead stock)
        latest_purchases = self.db.query(
            Purchase.medicine_id,
            Purchase.cost_price,
            Purchase.date
        ).order_by(Purchase.medicine_id, Purchase.date.desc()).all()
        
        cost_map = {}
        first_purchase_map = {}
        for p in latest_purchases:
            if p.medicine_id not in cost_map:
                cost_map[p.medicine_id] = float(p.cost_price)
            # Find the very first purchase date to identify "New" products
            # This prevents us from immediately flagging newly bought inventory as dead stock.
            existing_first = first_purchase_map.get(p.medicine_id)
            if not existing_first or p.date < existing_first:
                first_purchase_map[p.medicine_id] = p.date

        # 8. Fetch batch level expiry info
        # This allows us to flag dead stock that is also at risk of expiring before it sells.
        batches = self.db.query(MedicineBatch).filter(MedicineBatch.quantity > 0).all()
        batch_map = {}
        for b in batches:
            if b.medicine_id not in batch_map:
                batch_map[b.medicine_id] = []
            batch_map[b.medicine_id].append(b)

        items = []
        summary = {
            "dead_stock_items": 0,
            "slow_moving_items": 0,
            "inventory_value_at_risk": 0,
            "no_sales_items": 0,
            "expiry_risk_items": 0
        }

        for med in medicines:
            med_id = med.medicine_id
            current_stock = med.quantity
            
            # Use the latest purchase cost_price. 
            # If no purchase exists, fallback to estimating it at 70% of retail price.
            cost_price = cost_map.get(med_id, float(med.price) * 0.7) 
            inventory_value = current_stock * cost_price
            
            # Calculate Sales Velocity (Average items sold per day)
            units_sold_90d = demand_map.get(med_id, 0)
            avg_daily_demand = units_sold_90d / float(self.OBSERVATION_WINDOW_DAYS)
            
            # Calculate Days of Stock (How long until we run out)
            days_of_stock = float('inf')
            if avg_daily_demand > 0:
                days_of_stock = current_stock / avg_daily_demand
                
            # Calculate exactly how many days have passed since the last sale
            last_sale = last_sale_map.get(med_id)
            days_since_last_sale = None
            if last_sale:
                days_since_last_sale = (today - last_sale).days
                
            # Classify
            classification = "NORMAL"
            risk_score = 0
            reasons = []
            
            # 9. Is this a new product?
            # We don't want to penalize a product that was just added 5 days ago for having no sales.
            is_new = False
            first_received = first_purchase_map.get(med_id)
            if not first_received:
                # Fallback to mfg_date if no purchase history exists
                first_received = datetime.datetime.combine(med.mfg_date, datetime.datetime.min.time())
                
            if first_received and (today - first_received).days <= self.NEW_PRODUCT_DAYS:
                is_new = True

            # 10. Classification Logic Engine
            if current_stock == 0:
                classification = "OUT OF STOCK"
                risk_score = 0
            elif units_sold_90d == 0:
                # Handle Zero-Sales Case
                if is_new:
                    classification = "NEW / INSUFFICIENT DATA"
                    reasons.append(f"Added to inventory recently ({(today - first_received).days} days ago).")
                    risk_score = 10
                elif days_since_last_sale is None:
                    classification = "NO SALES (DEAD STOCK CANDIDATE)"
                    reasons.append("Never sold since introduction.")
                    summary["no_sales_items"] += 1
                    risk_score = 90
                elif days_since_last_sale >= self.DEAD_STOCK_NO_SALE_DAYS:
                    classification = "DEAD STOCK"
                    reasons.append(f"No sales in {days_since_last_sale} days.")
                    summary["dead_stock_items"] += 1
                    summary["inventory_value_at_risk"] += inventory_value
                    risk_score = 95 # Extremely high risk of dead capital
                elif days_since_last_sale >= self.POTENTIAL_DEAD_STOCK_DAYS:
                    classification = "SLOW MOVING"
                    reasons.append(f"No sales in {days_since_last_sale} days.")
                    summary["slow_moving_items"] += 1
                    risk_score = 75
            else:
                # Handle cases where the item IS selling, but maybe too slowly
                if days_of_stock > 180:
                    classification = "SLOW MOVING"
                    reasons.append(f"High inventory coverage: ~{int(days_of_stock)} days of stock remaining.")
                    summary["slow_moving_items"] += 1
                    risk_score = min(80, 50 + int(days_of_stock / 10))
                elif days_of_stock < 30 and avg_daily_demand > 1:
                    classification = "FAST MOVING"
                    reasons.append(f"Strong demand ({avg_daily_demand:.1f}/day) and low coverage ({int(days_of_stock)} days).")
                    risk_score = 5
                else:
                    classification = "NORMAL"
                    risk_score = 20

            # 11. Batch Expiry Risk Integration
            # We look at all active batches. If a batch expires BEFORE the estimated 'days_of_stock',
            # it is virtually guaranteed to expire on the shelf unless demand increases.
            med_batches = batch_map.get(med_id, [])
            batch_details = []
            has_expiry_risk = False
            for b in med_batches:
                if b.exp_date:
                    days_to_exp = (datetime.datetime.combine(b.exp_date, datetime.datetime.min.time()) - today).days
                    batch_risk = "Normal"
                    
                    if days_to_exp < 0:
                        batch_risk = "Expired"
                        risk_score = max(risk_score, 100) # Immediate loss of value
                    elif days_of_stock != float('inf') and days_of_stock > days_to_exp:
                        batch_risk = "Expiry Risk (Will not sell in time)"
                        has_expiry_risk = True
                        risk_score = max(risk_score, 85)
                    elif avg_daily_demand == 0 and days_to_exp < 180:
                        batch_risk = "Expiry Risk (No demand)"
                        has_expiry_risk = True
                        risk_score = max(risk_score, 90)
                        
                    batch_details.append({
                        "batch_no": b.batch_no,
                        "quantity": b.quantity,
                        "days_to_expiry": days_to_exp,
                        "risk": batch_risk
                    })

            if has_expiry_risk and classification in ["DEAD STOCK", "SLOW MOVING", "NO SALES (DEAD STOCK CANDIDATE)"]:
                classification = f"{classification} + EXPIRY RISK"
                summary["expiry_risk_items"] += 1
            elif has_expiry_risk:
                classification = "EXPIRY RISK"
                summary["expiry_risk_items"] += 1
                
            items.append({
                "medicine_id": med_id,
                "medicine_name": med.name,
                "current_stock": current_stock,
                "units_sold": units_sold_90d,
                "average_daily_demand": round(avg_daily_demand, 3),
                "days_since_last_sale": days_since_last_sale,
                "days_of_stock": None if days_of_stock == float('inf') else round(days_of_stock, 1),
                "inventory_value": round(inventory_value, 2),
                "classification": classification,
                "risk_score": min(100, risk_score),
                "reasons": reasons,
                "batches": batch_details
            })

        # Sort by risk score desc
        items.sort(key=lambda x: x["risk_score"], reverse=True)
        
        return {
            "summary": summary,
            "items": items
        }
