import os
import shutil
from bing_image_downloader import downloader
from PIL import Image
from app import create_app
from models.medicine import Medicine, db

app = create_app()

def compress_image(source_path, target_path):
    try:
        img = Image.open(source_path)
        if img.mode in ('RGBA', 'P'):
            img = img.convert('RGB')
            
        max_size = (300, 300)
        img.thumbnail(max_size, Image.Resampling.LANCZOS)
        
        # Save as JPEG with low quality for small size
        img.save(target_path, "JPEG", quality=70)
        return True
    except Exception as e:
        print(f"Error compressing {source_path}: {e}")
        return False

def scrape_images():
    upload_dir = os.path.join(os.path.dirname(__file__), 'static', 'uploads', 'medicines')
    temp_dir = os.path.join(os.path.dirname(__file__), 'temp_bing_images')
    os.makedirs(upload_dir, exist_ok=True)
    
    print(f"Scraping images via Bing and saving to {upload_dir}...")
    
    with app.app_context():
        medicines = Medicine.query.all()
        updated_count = 0
        
        for medicine in medicines:
            safe_name = "".join([c if c.isalnum() else "_" for c in medicine.name]).lower()
            filename = f"med_{medicine.medicine_id}_{safe_name}.jpg"
            target_path = os.path.join(upload_dir, filename)
            image_url = f"/uploads/medicines/{filename}"
            
            # Force replace the wrong images
            query = f"{medicine.name} box packaging site:1mg.com"
            print(f"Searching Bing for: {query}")
            
            try:
                # Download 1 image to temp directory (force replace)
                downloader.download(query, limit=1, output_dir=temp_dir, adult_filter_off=False, force_replace=True, timeout=10, verbose=False)
                
                # Find the downloaded file (bing_image_downloader replaces : with _ on Windows)
                query_dir = os.path.join(temp_dir, query.replace(':', '_'))
                if os.path.exists(query_dir) and os.listdir(query_dir):
                    downloaded_file = os.path.join(query_dir, os.listdir(query_dir)[0])
                    
                    # Compress and save to final location
                    if compress_image(downloaded_file, target_path):
                        medicine.image_url = image_url
                        updated_count += 1
                        print(f"Successfully processed image for {medicine.name}")
                    
                    # Clean up query dir
                    shutil.rmtree(query_dir, ignore_errors=True)
                else:
                    print(f"No image downloaded for {medicine.name}")
            except Exception as e:
                print(f"Failed to search/process {medicine.name}: {e}")
                
        db.session.commit()
        
        # Clean up temp dir
        shutil.rmtree(temp_dir, ignore_errors=True)
        print(f"Scraping complete! Updated {updated_count} medicines.")

if __name__ == '__main__':
    scrape_images()
