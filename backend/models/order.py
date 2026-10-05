from . import db
from datetime import datetime

class Order(db.Model):
    __tablename__ = 'orders'
    
    order_id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(db.Integer, db.ForeignKey('customers.customer_id'), nullable=False)
    order_date = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    total_amount = db.Column(db.Numeric(10, 2), nullable=False)
    status = db.Column(db.String(50), nullable=False, default='Pending Review')
    # Status options: 'Pending Review', 'Approved', 'Processing', 'Out for Delivery', 'Delivered', 'Rejected', 'Cancelled'
    
    payment_method = db.Column(db.String(50), default='Cash on Delivery')
    
    # Shipping Address
    shipping_address = db.Column(db.Text, nullable=False)
    shipping_city = db.Column(db.String(100))
    shipping_state = db.Column(db.String(100))
    shipping_pincode = db.Column(db.String(10))
    
    # Prescription (if needed)
    requires_prescription = db.Column(db.Boolean, default=False)
    prescription_uploaded = db.Column(db.Boolean, default=False)
    prescription_file_path = db.Column(db.String(255))
    prescription_status = db.Column(db.String(50))  # 'Pending', 'Approved', 'Rejected'
    
    # Staff notes
    staff_notes = db.Column(db.Text)
    reviewed_by = db.Column(db.Integer)  # User ID who reviewed (optional)
    reviewed_at = db.Column(db.DateTime)
    
    # Timestamps
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Delivery OTP
    delivery_otp = db.Column(db.String(4))
    
    # Relationships
    order_items = db.relationship('OrderItem', backref='order', lazy=True, cascade='all, delete-orphan')
    status_history = db.relationship('OrderStatusHistory', backref='order', lazy=True, cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<Order {self.order_id}>'

class OrderItem(db.Model):
    __tablename__ = 'order_items'
    
    order_item_id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.order_id'), nullable=False)
    medicine_id = db.Column(db.Integer, db.ForeignKey('medicines.medicine_id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    unit_price = db.Column(db.Numeric(10, 2), nullable=False)
    subtotal = db.Column(db.Numeric(10, 2), nullable=False)
    product_type = db.Column(db.String(10))  # 'OTC' or 'Rx' (snapshot at time of order)
    
    def __repr__(self):
        return f'<OrderItem {self.order_item_id}>'

class OrderStatusHistory(db.Model):
    __tablename__ = 'order_status_history'
    
    history_id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.order_id'), nullable=False)
    status = db.Column(db.String(50), nullable=False)
    changed_by = db.Column(db.Integer)  # User ID who changed status (optional)
    changed_at = db.Column(db.DateTime, default=datetime.utcnow)
    notes = db.Column(db.Text)
    
    def __repr__(self):
        return f'<OrderStatusHistory {self.history_id}>'
