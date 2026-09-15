from flask import Blueprint, request, jsonify
from models.medicine import Medicine, Company
from models.sale import Sale
from models.order import Order, OrderItem
from models.purchase import Purchase
from routes.auth_routes import token_required, role_required
from models import db
from datetime import datetime, timedelta
from sqlalchemy import func

replenishment_bp = Blueprint('replenishment', __name__)

@replenishment_bp.route('', methods=['GET'])
@token_required
def get_replenishment_predictions(current_user):
    """Calculate and return smart replenishment predictions"""
    try:
        now = datetime.utcnow()
        thirty_days_ago = now - timedelta(days=30)
        seven_days_ago = now - timedelta(days=7)
        
        # 1. Fetch all medicines with company info
        medicines = Medicine.query.join(Company).all()
        
        predictions = []
        
        for medicine in medicines:
            med_id = medicine.medicine_id
            
            # --- CALCULATE HISTORICAL DEMAND ---
            
            # POS Sales in last 30 days
            pos_sales_30d = db.session.query(func.sum(Sale.quantity)).filter(
                Sale.medicine_id == med_id,
                Sale.date >= thirty_days_ago
            ).scalar() or 0
            
            pos_sales_7d = db.session.query(func.sum(Sale.quantity)).filter(
                Sale.medicine_id == med_id,
                Sale.date >= seven_days_ago
            ).scalar() or 0
            
            # Online Orders in last 30 days (Delivered or Processing)
            # We assume 'Processing', 'Out for Delivery', 'Delivered' represent real demand
            # Exclude Cancelled, Rejected
            valid_statuses = ['Processing', 'Out for Delivery', 'Delivered']
            
            online_sales_30d = db.session.query(func.sum(OrderItem.quantity))\
                .join(Order)\
                .filter(
                    OrderItem.medicine_id == med_id,
                    Order.status.in_(valid_statuses),
                    Order.order_date >= thirty_days_ago
                ).scalar() or 0
                
            online_sales_7d = db.session.query(func.sum(OrderItem.quantity))\
                .join(Order)\
                .filter(
                    OrderItem.medicine_id == med_id,
                    Order.status.in_(valid_statuses),
                    Order.order_date >= seven_days_ago
                ).scalar() or 0
                
            total_30d = pos_sales_30d + online_sales_30d
            total_7d = pos_sales_7d + online_sales_7d
            
            # Daily averages
            avg_daily_30d = total_30d / 30.0
            avg_daily_7d = total_7d / 7.0
            
            # --- TREND DETECTION ---
            trend = "STABLE"
            if total_30d == 0 and total_7d == 0:
                trend = "INSUFFICIENT DATA"
            elif avg_daily_7d > (avg_daily_30d * 1.2):
                trend = "INCREASING"
            elif avg_daily_7d < (avg_daily_30d * 0.8):
                trend = "DECREASING"
                
            # Forecast demand: conservatively take the higher of the two averages
            # Or if no demand at all, default to 0
            forecast_daily = max(avg_daily_30d, avg_daily_7d)
            
            # --- CURRENT INVENTORY AND PENDING PURCHASES ---
            current_stock = medicine.quantity
            
            pending_purchases = db.session.query(func.sum(Purchase.quantity)).filter(
                Purchase.medicine_id == med_id,
                Purchase.status == 'Pending'
            ).scalar() or 0
            
            # --- STOCKOUT PREDICTION ---
            days_until_stockout = None
            if forecast_daily > 0:
                days_until_stockout = int(current_stock / forecast_daily)
                
            # --- REORDER POINT & QUANTITY ---
            lead_time_days = medicine.company.lead_time_days if medicine.company.lead_time_days else 5
            
            # Safety stock logic (7 days of buffer)
            safety_stock = int(forecast_daily * 7)
            
            # Reorder Point (when stock hits this, we need to order)
            reorder_point = int(forecast_daily * lead_time_days) + safety_stock
            
            # Recommended order quantity (target 30-day coverage minus what we have/ordered)
            # If forecast is 0, recommend 0 unless it's a new product, but we stick to data.
            target_stock = int(forecast_daily * 30) + safety_stock
            recommended_quantity = target_stock - current_stock - pending_purchases
            
            if recommended_quantity < 0:
                recommended_quantity = 0
                
            # --- PRIORITY ENGINE ---
            priority = "NO ACTION"
            if trend == "INSUFFICIENT DATA":
                priority = "INSUFFICIENT DATA"
            elif forecast_daily == 0:
                priority = "LOW"
            else:
                total_projected_stock = current_stock + pending_purchases
                
                # If projected stock covers less than lead time -> CRITICAL
                if days_until_stockout is not None and days_until_stockout <= lead_time_days:
                    priority = "CRITICAL"
                # If projected stock is below reorder point -> HIGH
                elif total_projected_stock <= reorder_point:
                    priority = "HIGH"
                elif trend == "INCREASING":
                    priority = "MEDIUM"
                else:
                    priority = "NORMAL"
                    
            predictions.append({
                'medicine_id': medicine.medicine_id,
                'medicine_name': medicine.name,
                'company_name': medicine.company.name,
                'supplier_id': medicine.company.company_id, # Reusing company_id as supplier for now
                'cost_price': float(medicine.price) * 0.7, # Estimate cost as 70% of retail price
                'current_stock': current_stock,
                'pending_purchases': pending_purchases,
                'demand_30d': total_30d,
                'demand_7d': total_7d,
                'forecast_daily': round(forecast_daily, 2),
                'trend': trend,
                'days_until_stockout': days_until_stockout,
                'lead_time_days': lead_time_days,
                'safety_stock': safety_stock,
                'reorder_point': reorder_point,
                'recommended_quantity': recommended_quantity,
                'priority': priority
            })
            
        return jsonify(predictions), 200
        
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return jsonify({'message': 'Error calculating replenishment', 'error': str(e)}), 500
