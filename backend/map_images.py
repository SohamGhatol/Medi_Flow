import os
import re
from app import create_app
from models.medicine import Medicine, db

app = create_app()

IMAGE_DIR = os.path.join(os.path.dirname(__file__), 'static', 'uploads', 'medicines')

def map_images():
    print("Starting image mapping...")
    
    if not os.path.exists(IMAGE_DIR):
        print(f"Directory {IMAGE_DIR} does not exist.")
        return
        
    image_files = os.listdir(IMAGE_DIR)
    print(f"Found {len(image_files)} files in the directory.")
    
    with app.app_context():
        medicines = Medicine.query.all()
        updated_count = 0
        
        for medicine in medicines:
            matched_file = None
            
            # 1. Match by med_{id}_ format
            id_prefix = f"med_{medicine.medicine_id}_"
            for f in image_files:
                if f.startswith(id_prefix) and f.endswith(('.jpg', '.jpeg', '.png', '.webp', '.avif', '.svg')):
                    matched_file = f
                    break
                    
            # 2. Match by exact name in filename (case insensitive)
            if not matched_file:
                for f in image_files:
                    if f.endswith(('.jpg', '.jpeg', '.png', '.webp', '.avif', '.svg')):
                        # simple heuristic, check if name is in the filename
                        med_name_clean = medicine.name.lower().replace(' ', '')
                        f_clean = f.lower().replace(' ', '').replace('_', '')
                        if med_name_clean in f_clean:
                            matched_file = f
                            break
                            
            if matched_file:
                image_url = f"/uploads/medicines/{matched_file}"
                if medicine.image_url != image_url:
                    medicine.image_url = image_url
                    updated_count += 1
                    print(f"Mapped {medicine.name} (ID: {medicine.medicine_id}) to {matched_file}")
            else:
                print(f"Could not find matching image for {medicine.name} (ID: {medicine.medicine_id})")
                
        db.session.commit()
        print(f"Mapping complete. Updated {updated_count} medicines.")

if __name__ == '__main__':
    map_images()
