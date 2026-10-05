import os
import requests
from io import BytesIO
from PIL import Image
from app import create_app
from models.medicine import Medicine, db

app = create_app()

def compress_image(image_bytes, target_path):
    try:
        img = Image.open(BytesIO(image_bytes))
        if img.mode in ('RGBA', 'P'):
            img = img.convert('RGB')
            
        max_size = (400, 400) # Slightly larger for better clarity
        img.thumbnail(max_size, Image.Resampling.LANCZOS)
        
        # Save as JPEG with good quality for authenticity
        img.save(target_path, "JPEG", quality=85)
        return True
    except Exception as e:
        print(f"Error compressing image: {e}")
        return False

def scrape_pharmeasy():
    upload_dir = os.path.join(os.path.dirname(__file__), 'static', 'uploads', 'medicines')
    os.makedirs(upload_dir, exist_ok=True)
    
    print(f"Scraping exact images from PharmEasy and saving to {upload_dir}...")
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
    
    with app.app_context():
        medicines = Medicine.query.all()
        updated_count = 0
        
        for medicine in medicines:
            safe_name = "".join([c if c.isalnum() else "_" for c in medicine.name]).lower()
            filename = f"med_{medicine.medicine_id}_{safe_name}.jpg"
            target_path = os.path.join(upload_dir, filename)
            image_url = f"/uploads/medicines/{filename}"
            
            # Combine name and company for an extremely accurate search match
            company_name = medicine.company.name if medicine.company else ''
            query = f"{medicine.name} {company_name}"
            print(f"\nSearching PharmEasy for: {query}")
            
            try:
                # Search directly on PharmEasy API
                search_url = f"https://pharmeasy.in/api/search/search/?p=1&q={query}"
                res = requests.get(search_url, headers=headers, timeout=10)
                
                if res.status_code == 200:
                    data = res.json()
                    products = data.get('data', {}).get('products', [])
                    
                    if products:
                        # Find the first product that matches the manufacturer
                        target_company = company_name.lower()
                        strict_match = None
                        
                        for p in products:
                            pharmeasy_manufacturer = p.get('manufacturer', '').lower()
                            # Check if the company name is a substring of the PharmEasy manufacturer
                            if target_company in pharmeasy_manufacturer or pharmeasy_manufacturer in target_company:
                                strict_match = p
                                break
                                
                        if strict_match:
                            print(f"Strict match found! Manufacturer: {strict_match.get('manufacturer')}")
                            # Try to get the high res damImage first (like box-front)
                            dam_images = strict_match.get('damImages', [])
                            img_url = strict_match.get('image', '')
                            
                            if dam_images:
                                # Prefer box-front or front for a trustworthy look
                                for d_img in dam_images:
                                    if d_img.get('face') in ['box-front', 'front']:
                                        img_url = d_img.get('url')
                                        break
                                if not img_url and dam_images:
                                    img_url = dam_images[0].get('url')
                            
                            if img_url:
                                # Remove watermark parameters from URL if present
                                img_url = img_url.split('?')[0]
                                print(f"Found authentic image URL: {img_url}")
                                
                                # Download the image
                                img_res = requests.get(img_url, headers=headers, timeout=10)
                                if img_res.status_code == 200:
                                    if compress_image(img_res.content, target_path):
                                        medicine.image_url = image_url
                                        updated_count += 1
                                        print(f"Successfully processed exact image for {medicine.name}")
                                else:
                                    print(f"Failed to download image file for {medicine.name}")
                            else:
                                print(f"No image URL found in PharmEasy response for {medicine.name}")
                        else:
                            print(f"Rejected: No strict manufacturer match found for {company_name}")
                    else:
                        print(f"No products found on PharmEasy for {medicine.name}")
                else:
                    print(f"PharmEasy search failed with status {res.status_code} for {medicine.name}")
                    
            except Exception as e:
                print(f"Failed to search/process {medicine.name}: {e}")
                
        db.session.commit()
        print(f"\nScraping complete! Updated {updated_count} medicines with exact authentic images.")

if __name__ == '__main__':
    scrape_pharmeasy()
