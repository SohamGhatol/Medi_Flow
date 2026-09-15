from . import db
from datetime import datetime

class MedicineBatch(db.Model):
    __tablename__ = 'medicine_batches'
    
    batch_id = db.Column(db.Integer, primary_key=True)
    medicine_id = db.Column(db.Integer, db.ForeignKey('medicines.medicine_id'), nullable=False)
    batch_no = db.Column(db.String(100), nullable=False)
    mfg_date = db.Column(db.Date, nullable=True)
    exp_date = db.Column(db.Date, nullable=True)
    quantity = db.Column(db.Integer, nullable=False, default=0)
    status = db.Column(db.String(50), nullable=False, default='ACTIVE') # ACTIVE, EXPIRED, DEPLETED, UNKNOWN_EXPIRY
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship with medicine
    medicine = db.relationship('Medicine', backref=db.backref('batches', lazy=True, cascade='all, delete-orphan'))
    
    def __repr__(self):
        return f'<MedicineBatch {self.batch_no} (Med: {self.medicine_id}) Qty: {self.quantity}>'

class SaleBatchAllocation(db.Model):
    __tablename__ = 'sale_batch_allocations'
    
    allocation_id = db.Column(db.Integer, primary_key=True)
    sale_id = db.Column(db.Integer, db.ForeignKey('sales.sale_id'), nullable=False)
    batch_id = db.Column(db.Integer, db.ForeignKey('medicine_batches.batch_id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    sale = db.relationship('Sale', backref=db.backref('batch_allocations', lazy=True, cascade='all, delete-orphan'))
    batch = db.relationship('MedicineBatch', backref=db.backref('sale_allocations', lazy=True))

class OrderBatchAllocation(db.Model):
    __tablename__ = 'order_batch_allocations'
    
    allocation_id = db.Column(db.Integer, primary_key=True)
    order_item_id = db.Column(db.Integer, db.ForeignKey('order_items.order_item_id'), nullable=False)
    batch_id = db.Column(db.Integer, db.ForeignKey('medicine_batches.batch_id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    order_item = db.relationship('OrderItem', backref=db.backref('batch_allocations', lazy=True, cascade='all, delete-orphan'))
    batch = db.relationship('MedicineBatch', backref=db.backref('order_allocations', lazy=True))
