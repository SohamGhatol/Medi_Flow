from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

# Import all models
from .user import User, Role
from .medicine import Medicine, Company
from .customer import Customer, CartItem
from .order import Order, OrderItem, OrderStatusHistory
from .prescription_ocr import PrescriptionOCRResult, PrescriptionMedicineExtraction
from .batch import MedicineBatch, SaleBatchAllocation, OrderBatchAllocation

__all__ = [
    'User', 
    'Role', 
    'Customer', 
    'Medicine', 
    'Company', 
    'Sale', 
    'Purchase',
    'Order',
    'OrderItem',
    'OrderStatusHistory',
    'PrescriptionOCRResult',
    'PrescriptionMedicineExtraction',
    'MedicineBatch',
    'SaleBatchAllocation',
    'OrderBatchAllocation'
]