import os
import re
import time
import requests
from bs4 import BeautifulSoup
from PIL import Image
from io import BytesIO

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

def text_similarity(query, candidate_text):
    """Basic text similarity scoring"""
    query_tokens = set(re.sub(r'[^a-z0-9]+', ' ', query.lower()).split())
    candidate_tokens = set(re.sub(r'[^a-z0-9]+', ' ', candidate_text.lower()).split())
    if not query_tokens:
        return 0
    return len(query_tokens.intersection(candidate_tokens)) / len(query_tokens)

def get_google_images(query, session):
    """Scrape Google Images HTML for image URLs"""
    search_url = f"https://www.google.com/search?q={requests.utils.quote(query)}&tbm=isch"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    
    try:
        response = session.get(search_url, headers=headers, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        
        images = []
        for img in soup.find_all('img'):
            src = img.get('src') or img.get('data-src')
            alt = img.get('alt', '')
            if src and src.startswith('http') and 'logo' not in src.lower() and 'icon' not in src.lower():
                images.append({'url': src, 'alt': alt})
        return images
    except Exception as e:
        print(f"Error fetching Google Images for '{query}': {e}")
        return []

def validate_and_process_image(image_bytes, target_path):
    """Validates image size and saves as 300x300 JPEG"""
    try:
        img = Image.open(BytesIO(image_bytes))
        
        # Validate format & size
        if img.format == 'SVG' or img.width < MIN_IMAGE_SIZE[0] or img.height < MIN_IMAGE_SIZE[1]:
            return False, "Image too small or invalid format"
            
        # Convert to RGB
        if img.mode in ('RGBA', 'P', 'LA'):
            img = img.convert('RGB')
            
        # Create a white background canvas of TARGET_SIZE
        canvas = Image.new('RGB', TARGET_SIZE, (255, 255, 255))
        
        # Resize maintaining aspect ratio
        img.thumbnail(TARGET_SIZE, Image.Resampling.LANCZOS)
        
        # Paste centered on canvas
        offset_x = (TARGET_SIZE[0] - img.width) // 2
        offset_y = (TARGET_SIZE[1] - img.height) // 2
        canvas.paste(img, (offset_x, offset_y))
        
        # Save
        canvas.save(target_path, "JPEG", quality=JPEG_QUALITY)
        return True, "Success"
        
    except Exception as e:
        return False, str(e)

def download_image(url, session):
    try:
        response = session.get(url, timeout=10)
        response.raise_for_status()
        content_type = response.headers.get('Content-Type', '')
        if not content_type.startswith('image/'):
            return None
        return response.content
    except Exception:
        return None

def process_medicines():
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    session = requests.Session()
    
    if HAS_FLASK:
        app = create_app()
        with app.app_context():
            medicines = Medicine.query.all()
    else:
        # Fallback for testing
        class DummyMed:
            def __init__(self, name):
                self.name = name
                self.image_url = None
        medicines = [DummyMed("Paracetamol 500mg"), DummyMed("Omega-3 Fish Oil")]
        
    success_count = 0
    failed_medicines = []
    
    print(f"Starting scraping for {len(medicines)} medicines...\n")
    
    for i, med in enumerate(medicines, 1):
        print(f"[{i}/{len(medicines)}] Searching: {med.name}")
        
        # Check cache
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

        # Strategy: Google Images search with "box packaging" and restrict to known pharmacy sites if needed.
        # But doing a generic search with strict keywords often yields the best first result.
        query = f"{med.name} medicine tablet box packaging"
        candidates = get_google_images(query, session)
        
        success = False
        for idx, candidate in enumerate(candidates[:5]):
            print(f"[{i}/{len(medicines)}] Evaluating candidate {idx+1}: {candidate['alt'][:30]}...")
            
            # Download candidate
            img_bytes = download_image(candidate['url'], session)
            if not img_bytes:
                continue
                
            # Process & Validate
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
                
        if not success:
            print(f"[{i}/{len(medicines)}] FAILED: {med.name} (No sufficiently reliable image found)")
            failed_medicines.append(med.name)
            
        # Rate limiting
        time.sleep(2)
        
    # Final Report
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
