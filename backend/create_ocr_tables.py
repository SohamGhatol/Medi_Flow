from app import create_app
from models import db
from models.prescription_ocr import PrescriptionOCRResult, PrescriptionMedicineExtraction

def create_tables():
    app = create_app()
    with app.app_context():
        print("Creating OCR tables...")
        db.create_all()
        print("OCR tables created successfully.")

if __name__ == "__main__":
    create_tables()
