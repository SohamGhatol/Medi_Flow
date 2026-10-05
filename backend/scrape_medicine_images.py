import os
import requests
from io import BytesIO
from PIL import Image
from duckduckgo_search import DDGS
from app import create_app
from models.medicine import Medicine, db

app = create_app()

def scrape_medicine_images():
    upload_dir = os.path.join(os.path.dirname(__file__), 'uploads', 'medicines')
    os.makedirs(upload_dir, exist_ok=True)
    
    print(f"Scraping images and saving to {upload_dir}...")
    
    with app.app_context():
        medicines = Medicine.query.all()
        updated_count = 0
        
        with DDGS() as ddgs:
            for medicine in medicines:
                # Skip if already has a specific image (not default)
                if medicine.image_url and "default" not in medicine.image_url and os.path.exists(os.path.join(os.path.dirname(__file__), medicine.image_url.lstrip('/'))):
                    print(f"Skipping {medicine.name}, already has an image.")
                    continue
                
                import time
                time.sleep(3)
                
                query = f"{medicine.name} medicine front box"
                print(f"Searching for: {query}")
                
                try:
                    results = list(ddgs.images(query, max_results=1))
                    if results:
                        img_url = results[0]['image']
                        print(f"Found image URL: {img_url}")
                        
                        # Download image
                        response = requests.get(img_url, timeout=10)
                        response.raise_for_status()
                        
                        # Process image with Pillow (resize to keep size small)
                        img = Image.open(BytesIO(response.content))
                        
                        # Convert to RGB if it's not (e.g. RGBA or P)
                        if img.mode in ('RGBA', 'P'):
                            img = img.convert('RGB')
                        
                        # Resize maintaining aspect ratio
                        max_size = (300, 300)
                        img.thumbnail(max_size, Image.LANCZOS)
                        
                        # Save image
                        filename = f"med_{medicine.medicine_id}.jpg"
                        filepath = os.path.join(upload_dir, filename)
                        img.save(filepath, "JPEG", quality=75)
                        
                        # Update DB
                        medicine.image_url = f"/uploads/medicines/{filename}"
                        updated_count += 1
                        print(f"Successfully saved image for {medicine.name}")
                    else:
                        print(f"No results found for {medicine.name}")
                except Exception as e:
                    print(f"Failed to process {medicine.name}: {str(e)}")
                
        db.session.commit()
        print(f"Update complete! Processed {len(medicines)} medicines.")
        print(f"Updated database records for {updated_count} medicines.")

if __name__ == '__main__':
    scrape_medicine_images()
