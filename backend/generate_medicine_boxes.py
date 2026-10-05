import os
import re
import urllib.request
import time
from PIL import Image
from io import BytesIO

try:
    from app import create_app
    from models.medicine import Medicine, db
    HAS_FLASK = True
except ImportError:
    HAS_FLASK = False

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), 'static', 'uploads', 'medicines')

def sanitize_filename(name):
    clean_name = re.sub(r'[^a-z0-9]+', '_', name.lower()).strip('_')
    return f"{clean_name}.jpg"

def generate_box_image(medicine_name, category):
    # Create a detailed prompt for a realistic medicine box
    prompt = f"A photorealistic studio product shot of a rectangular cardboard medicine packaging box isolated on a pure white background. The box clearly has the text '{medicine_name}' printed on the front in bold modern font. Medical packaging style for {category}. Clear lighting, sharp focus, 8k resolution, highly detailed."
    encoded_prompt = urllib.parse.quote(prompt)
    url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=400&height=400&nologo=true"
    
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=30) as response:
            image_data = response.read()
            
        img = Image.open(BytesIO(image_data))
        if img.mode != 'RGB':
            img = img.convert('RGB')
        return img
    except Exception as e:
        print(f"Error generating image for {medicine_name}: {e}")
        return None

def process_medicines():
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    
    if HAS_FLASK:
        app = create_app()
        with app.app_context():
            medicines = Medicine.query.all()
    else:
        class DummyMed:
            def __init__(self, name, category):
                self.name = name
                self.category = category
                self.image_url = None
        medicines = [DummyMed("Aspirin 75mg", "Heart & Blood Pressure")]
        
    print(f"Starting AI generation for {len(medicines)} medicines...\n")
    
    for i, med in enumerate(medicines, 1):
        filename = sanitize_filename(med.name)
        target_path = os.path.join(UPLOAD_DIR, filename)
        
        print(f"[{i}/{len(medicines)}] Generating image for: {med.name}...")
        
        img = generate_box_image(med.name, med.category)
        if img:
            img.save(target_path, "JPEG", quality=85)
            print(f"[{i}/{len(medicines)}] Saved successfully.")
            
            if HAS_FLASK:
                with app.app_context():
                    med.image_url = f"/uploads/medicines/{filename}"
                    db.session.commit()
        else:
            print(f"[{i}/{len(medicines)}] FAILED.")
            
        # Small delay to avoid overwhelming the free API
        time.sleep(1)
        
    print("\nFinished generating all AI medicine boxes!")

if __name__ == "__main__":
    import urllib.parse
    process_medicines()
