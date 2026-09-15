from . import db
from datetime import datetime

class Company(db.Model):
    __tablename__ = 'companies'
    
    company_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    contact = db.Column(db.String(50))
    address = db.Column(db.Text)
    lead_time_days = db.Column(db.Integer, default=5)  # Expected lead time for deliveries
    
    # Relationship
    medicines = db.relationship('Medicine', backref='company', lazy=True)
    
    def __repr__(self):
        return f'<Company {self.name}>'

class Medicine(db.Model):
    __tablename__ = 'medicines'
    
    medicine_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    company_id = db.Column(db.Integer, db.ForeignKey('companies.company_id'), nullable=False)
    batch_no = db.Column(db.String(50), nullable=False)
    mfg_date = db.Column(db.Date, nullable=False)
    exp_date = db.Column(db.Date, nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    min_stock = db.Column(db.Integer, nullable=False, default=10)
    price = db.Column(db.Numeric(10, 2), nullable=False)
    product_type = db.Column(db.String(10), nullable=False, default='OTC')  # 'OTC' or 'Rx'
    category = db.Column(db.String(50), default='Uncategorized')
    generic_name = db.Column(db.String(100))
    dosage_form = db.Column(db.String(50))
    strength = db.Column(db.String(50))
    description = db.Column(db.Text)
    image_url = db.Column(db.String(255))
    
    # Relationship
    order_items = db.relationship('OrderItem', backref='medicine', lazy=True)
    
    def __repr__(self):
        return f'<Medicine {self.name}>'