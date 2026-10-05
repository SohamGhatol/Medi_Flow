import os
import time
from app import create_app
from models.medicine import Medicine, db
from generate_medicine_boxes import generate_box_image, sanitize_filename

app = create_app()

def fix_images():
    medicines_to_fix = [
        "Antacid Tablets",
        "Aspirin Protect",
        "Atorvastatin 20mg",
        "Benzocaine Oral Gel"
    ]
    
    upload_dir = os.path.join(os.path.dirname(__file__), 'static', 'uploads', 'medicines')
    
    print(f"Fixing images for {len(medicines_to_fix)} specific medicines using AI generation...\n")
    
    with app.app_context():
        for med_name in medicines_to_fix:
            med = Medicine.query.filter_by(name=med_name).first()
            if not med:
                continue
                
            print(f"Generating new clean AI box for: {med.name}...")
            
            # Retry logic
            img = None
            for attempt in range(3):
                img = generate_box_image(med.name, med.category)
                if img:
                    break
                print(f"Attempt {attempt+1} failed for {med.name}. Waiting 5 seconds...")
                time.sleep(5)
                
            if img:
                filename = sanitize_filename(med.name)
                target_path = os.path.join(upload_dir, filename)
                img.save(target_path, "JPEG", quality=85)
                med.image_url = f"/uploads/medicines/{filename}"
                print(f"Successfully fixed image for {med.name}!")
            else:
                print(f"Failed to generate image for {med.name} after retries.")
            
            # Rate limit cooldown between successful runs
            time.sleep(3)
                
        db.session.commit()
        print("\nAll specified medicines have been fixed!")

if __name__ == "__main__":
    fix_images()
