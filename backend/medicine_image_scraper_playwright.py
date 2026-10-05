import os
import re
import time
import requests
from io import BytesIO
from PIL import Image
from playwright.sync_api import sync_playwright

# Try to import Flask app models, fallback to dummy list if not available
try:
    from app import create_app
    from models.medicine import Medicine, db
    HAS_FLASK = True
except ImportError:
    HAS_FLASK = False

# Configuration
TARGET_SIZE = (300, 300)
JPEG_QUALITY = 80
MIN_IMAGE_SIZE = (100, 100)
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), 'static', 'uploads', 'medicines')

def sanitize_filename(name):
    clean_name = re.sub(r'[^a-z0-9]+', '_', name.lower()).strip('_')
    return f"{clean_name}.jpg"

def validate_and_process_image(image_bytes, target_path):
    try:
        img = Image.open(BytesIO(image_bytes))
        
        if img.format == 'SVG' or img.width < MIN_IMAGE_SIZE[0] or img.height < MIN_IMAGE_SIZE[1]:
            return False, f"Image too small ({img.width}x{img.height}) or invalid format ({img.format})"
            
        if img.mode in ('RGBA', 'P', 'LA'):
            img = img.convert('RGB')
            
        canvas = Image.new('RGB', TARGET_SIZE, (255, 255, 255))
        img.thumbnail(TARGET_SIZE, Image.Resampling.LANCZOS)
        offset_x = (TARGET_SIZE[0] - img.width) // 2
        offset_y = (TARGET_SIZE[1] - img.height) // 2
        canvas.paste(img, (offset_x, offset_y))
        
        canvas.save(target_path, "JPEG", quality=JPEG_QUALITY)
        return True, "Success"
    except Exception as e:
        return False, str(e)

def download_image(url):
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        content_type = response.headers.get('Content-Type', '')
        if not content_type.startswith('image/'):
            return None
        return response.content
    except Exception:
        return None

def process_medicines():
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    
    if HAS_FLASK:
        app = create_app()
        with app.app_context():
            medicines = Medicine.query.all()
    else:
        class DummyMed:
            def __init__(self, name):
                self.name = name
                self.image_url = None
        medicines = [DummyMed("Paracetamol 500mg"), DummyMed("Omega-3 Fish Oil")]
        
    success_count = 0
    failed_medicines = []
    
    print(f"Starting scraping for {len(medicines)} medicines using Playwright...\n")
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
        )
        page = context.new_page()
        
        for i, med in enumerate(medicines, 1):
            print(f"[{i}/{len(medicines)}] Searching: {med.name}")
            
            filename = sanitize_filename(med.name)
            target_path = os.path.join(UPLOAD_DIR, filename)
            
            if os.path.exists(target_path):
                print(f"[{i}/{len(medicines)}] Skipped: Image already exists in cache")
                if HAS_FLASK and getattr(med, 'image_url', None) != f"/uploads/medicines/{filename}":
                     with app.app_context():
                        med.image_url = f"/uploads/medicines/{filename}"
                        db.session.commit()
                success_count += 1
                continue

            query = f"{med.name} medicine tablet box packaging"
            search_url = f"https://duckduckgo.com/?q={requests.utils.quote(query)}&ia=images&iax=images"
            
            success = False
            try:
                page.goto(search_url, timeout=15000)
                # Wait for images to load
                page.wait_for_selector('img.tile--img__img', timeout=10000)
                
                # Get image elements
                images = page.locator('img.tile--img__img').all()
                candidates = []
                for img in images[:5]:
                    src = img.get_attribute('src')
                    if src:
                        if src.startswith('//'):
                            src = 'https:' + src
                        candidates.append(src)
                        
                for idx, src in enumerate(candidates):
                    print(f"[{i}/{len(medicines)}] Evaluating candidate {idx+1}...")
                    img_bytes = download_image(src)
                    if not img_bytes:
                        continue
                        
                    is_valid, reason = validate_and_process_image(img_bytes, target_path)
                    
                    if is_valid:
                        print(f"[{i}/{len(medicines)}] Saved: {filename}")
                        success = True
                        if HAS_FLASK:
                            with app.app_context():
                                med.image_url = f"/uploads/medicines/{filename}"
                                db.session.commit()
                        break
                    else:
                        print(f"[{i}/{len(medicines)}] Candidate rejected: {reason}")
            except Exception as e:
                print(f"[{i}/{len(medicines)}] Playwright navigation error: {str(e)}")
                
            if not success:
                print(f"[{i}/{len(medicines)}] FAILED: {med.name} (No sufficiently reliable image found)")
                failed_medicines.append(med.name)
                
            time.sleep(2)
            
        browser.close()
        
    print("\n" + "="*40)
    print("SCRAPING REPORT")
    print("="*40)
    print(f"Total processed: {len(medicines)}")
    print(f"Successful: {success_count}")
    print(f"Failed: {len(failed_medicines)}")
    
    if failed_medicines:
        print("\nFailed Medicines:")
        for name in failed_medicines:
            print(f"- {name}")

if __name__ == "__main__":
    process_medicines()
