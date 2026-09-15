from . import db
from datetime import datetime

class Purchase(db.Model):
    __tablename__ = 'purchases'
    
    purchase_id = db.Column(db.Integer, primary_key=True)
    supplier_id = db.Column(db.Integer, nullable=False)  # Would reference suppliers table
    medicine_id = db.Column(db.Integer, db.ForeignKey('medicines.medicine_id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    cost_price = db.Column(db.Numeric(10, 2), nullable=False)
    total = db.Column(db.Numeric(10, 2), nullable=False)
    invoice_no = db.Column(db.String(50), nullable=False)
    date = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    status = db.Column(db.String(50), nullable=False, default='Received') # 'Pending', 'Received', 'Cancelled'
    expected_date = db.Column(db.DateTime, nullable=True)
    
    # Relationship
    medicine = db.relationship('Medicine', backref='purchases', lazy=True)
    
    def __repr__(self):
        return f'<Purchase {self.purchase_id}>'