from . import db
from datetime import datetime

class PrescriptionOCRResult(db.Model):
    __tablename__ = 'prescription_ocr_results'
    
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.order_id'), nullable=False)
    raw_ocr_text = db.Column(db.Text, nullable=True)
    processing_status = db.Column(db.String(50), nullable=False, default='PROCESSING') 
    # Status: 'PROCESSING', 'COMPLETED', 'FAILED', 'VERIFIED'
    
    overall_confidence = db.Column(db.Float, nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    extractions = db.relationship('PrescriptionMedicineExtraction', backref='ocr_result', lazy=True, cascade='all, delete-orphan')

    def __repr__(self):
        return f'<PrescriptionOCRResult {self.id} for Order {self.order_id}>'

class PrescriptionMedicineExtraction(db.Model):
    __tablename__ = 'prescription_medicine_extractions'
    
    id = db.Column(db.Integer, primary_key=True)
    ocr_result_id = db.Column(db.Integer, db.ForeignKey('prescription_ocr_results.id'), nullable=False)
    medicine_id = db.Column(db.Integer, db.ForeignKey('medicines.medicine_id'), nullable=True)
    
    extracted_name = db.Column(db.String(255), nullable=True)
    extracted_strength = db.Column(db.String(100), nullable=True)
    extracted_dosage = db.Column(db.String(100), nullable=True)
    extracted_duration = db.Column(db.String(100), nullable=True)
    
    confidence_score = db.Column(db.Float, nullable=True)
    match_status = db.Column(db.String(50), nullable=False, default='NO_MATCH')
    # Status: 'HIGH', 'MEDIUM', 'LOW', 'NO_MATCH', 'AMBIGUOUS'
    
    # Store JSON array of alternative matches if status is AMBIGUOUS
    candidate_medicines = db.Column(db.JSON, nullable=True)

    def __repr__(self):
        return f'<PrescriptionMedicineExtraction {self.id} -> {self.extracted_name}>'
