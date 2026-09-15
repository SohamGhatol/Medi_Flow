import os
from app import create_app
from models.medicine import Medicine, db

app = create_app()

def set_default_images():
    print("Setting realistic AI-generated default image for all medicines...")
    
    with app.app_context():
        medicines = Medicine.query.all()
        updated_count = 0
        
        for medicine in medicines:
            # We use the generated realistic default image for all existing medicines
            image_url = "/uploads/medicines/default_medicine.jpg"
            
            if medicine.image_url != image_url:
                medicine.image_url = image_url
                updated_count += 1
                
        db.session.commit()
        
        print(f"Update complete! Processed {len(medicines)} medicines.")
        print(f"Updated database records for {updated_count} medicines.")

if __name__ == '__main__':
    set_default_images()
