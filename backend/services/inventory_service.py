from models import db
from models.batch import MedicineBatch, SaleBatchAllocation, OrderBatchAllocation
from models.medicine import Medicine
from sqlalchemy.exc import SQLAlchemyError
from datetime import datetime

class InsufficientStockError(Exception):
    pass

class InventoryService:
    @staticmethod
    def allocate_stock_fefo(medicine_id, requested_qty, allocation_type='sale', reference_id=None):
        """
        Allocates stock from batches using FEFO (First-Expire-First-Out).
        Uses row-level locking to prevent race conditions.
        
        Args:
            medicine_id (int): ID of the medicine
            requested_qty (int): Quantity to allocate
            allocation_type (str): 'sale' or 'order'
            reference_id (int): sale_id or order_item_id
            
        Returns:
            list: List of created allocations
            
        Raises:
            InsufficientStockError: If not enough stock available
        """
        if requested_qty <= 0:
            return []
            
        try:
            # 1. Lock the parent medicine record to prevent concurrent updates to its aggregate quantity
            medicine = Medicine.query.with_for_update().get(medicine_id)
            if not medicine:
                raise ValueError(f"Medicine {medicine_id} not found")
                
            # 2. Lock and fetch eligible batches, ordered by exp_date
            # We skip EXPIRED or DEPLETED batches.
            # Use with_for_update() to lock these rows.
            batches = MedicineBatch.query.with_for_update().filter(
                MedicineBatch.medicine_id == medicine_id,
                MedicineBatch.quantity > 0,
                MedicineBatch.status.in_(['ACTIVE', 'UNKNOWN_EXPIRY'])
            ).order_by(MedicineBatch.exp_date.asc()).all()
            
            # Check if total available across valid batches is sufficient
            total_available = sum(b.quantity for b in batches)
            if total_available < requested_qty:
                raise InsufficientStockError(f"Insufficient stock for medicine {medicine_id}. Requested: {requested_qty}, Available: {total_available}")
                
            allocations = []
            remaining_qty = requested_qty
            
            # 3. Perform FEFO allocation
            for batch in batches:
                if remaining_qty <= 0:
                    break
                    
                alloc_qty = min(remaining_qty, batch.quantity)
                batch.quantity -= alloc_qty
                remaining_qty -= alloc_qty
                
                if batch.quantity == 0:
                    batch.status = 'DEPLETED'
                    
                # Create allocation record
                if allocation_type == 'sale':
                    alloc = SaleBatchAllocation(
                        sale_id=reference_id,
                        batch_id=batch.batch_id,
                        quantity=alloc_qty
                    )
                elif allocation_type == 'order':
                    alloc = OrderBatchAllocation(
                        order_item_id=reference_id,
                        batch_id=batch.batch_id,
                        quantity=alloc_qty
                    )
                else:
                    raise ValueError(f"Invalid allocation type {allocation_type}")
                    
                db.session.add(alloc)
                allocations.append(alloc)
                
            # 4. Update the aggregate Medicine quantity cache
            medicine.quantity -= requested_qty
            
            # Note: We do NOT commit here. The caller should commit the entire transaction.
            return allocations
            
        except Exception as e:
            # The caller will handle the rollback
            raise e

    @staticmethod
    def get_expiry_risk(batch):
        """
        Analyzes a single MedicineBatch to determine expiry risk.
        Returns a dict with risk intelligence.
        """
        now = datetime.utcnow().date()
        
        # Default for unknown expiry
        if batch.status == 'UNKNOWN_EXPIRY' or not batch.exp_date:
            return {
                "days_remaining": None,
                "risk_level": "UNKNOWN",
                "status": "UNKNOWN_EXPIRY"
            }
            
        days_remaining = (batch.exp_date - now).days
        
        if days_remaining <= 0:
            return {
                "days_remaining": days_remaining,
                "risk_level": "EXPIRED",
                "status": "EXPIRED"
            }
        elif days_remaining <= 7:
            risk = "CRITICAL"
        elif days_remaining <= 30:
            risk = "HIGH"
        elif days_remaining <= 90:
            risk = "MEDIUM"
        else:
            risk = "SAFE"
            
        return {
            "days_remaining": days_remaining,
            "risk_level": risk,
            "status": "ACTIVE"
        }
        
    @staticmethod
    def get_available_stock(medicine_id):
        """Returns the total available non-expired stock across all batches"""
        total = db.session.query(db.func.sum(MedicineBatch.quantity)).filter(
            MedicineBatch.medicine_id == medicine_id,
            MedicineBatch.quantity > 0,
            MedicineBatch.status.in_(['ACTIVE', 'UNKNOWN_EXPIRY'])
        ).scalar()
        return total or 0
        
    @staticmethod
    def sync_aggregate_stock(medicine_id):
        """Utility to recalculate Medicine.quantity from active batches"""
        medicine = Medicine.query.with_for_update().get(medicine_id)
        if not medicine:
            return False
            
        total = db.session.query(db.func.sum(MedicineBatch.quantity)).filter(
            MedicineBatch.medicine_id == medicine_id,
            MedicineBatch.status.in_(['ACTIVE', 'UNKNOWN_EXPIRY'])
        ).scalar()
        
        medicine.quantity = total or 0
        return True
