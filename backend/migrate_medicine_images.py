import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app import create_app
from models.medicine import Medicine, db

app = create_app()

CATEGORY_COLORS = {
    'Pain Relief': '#ef4444',
    'Cold & Cough': '#3b82f6',
    'Allergy & Sinus': '#10b981',
    'Digestive Health': '#f59e0b',
    'Vitamins & Supplements': '#8b5cf6',
    'Heart & Blood Pressure': '#ec4899',
    'Diabetes Care': '#14b8a6',
    'Skin Care': '#f43f5e',
    'First Aid': '#ef4444',
    'Oral Care': '#0ea5e9',
    'Uncategorized': '#64748b'
}

def generate_svg(name, category):
    color = CATEGORY_COLORS.get(category, '#64748b')
    # Split name into multiple lines if it's too long
    words = name.split()
    line1 = " ".join(words[:2])
    line2 = " ".join(words[2:]) if len(words) > 2 else ""
    
    return f"""<svg width="400" height="400" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
  <rect width="400" height="400" rx="40" fill="{color}" opacity="0.1" />
  <rect x="50" y="50" width="300" height="300" rx="30" fill="{color}" opacity="0.2" />
  
  <g transform="translate(200, 150)">
    <!-- Pill body -->
    <rect x="-60" y="-30" width="120" height="60" rx="30" fill="{color}" />
    <!-- Pill highlight -->
    <path d="M -30 -30 L -30 30" stroke="white" stroke-width="4" opacity="0.5" />
    <path d="M 0 -30 L 0 30" stroke="white" stroke-width="4" opacity="0.3" />
  </g>
  
  <!-- Text -->
  <text x="200" y="240" font-family="system-ui, -apple-system, sans-serif" font-weight="bold" font-size="24" fill="{color}" text-anchor="middle">
    {line1}
  </text>
  <text x="200" y="275" font-family="system-ui, -apple-system, sans-serif" font-weight="bold" font-size="20" fill="{color}" text-anchor="middle">
    {line2}
  </text>
  <text x="200" y="320" font-family="system-ui, -apple-system, sans-serif" font-size="16" fill="{color}" text-anchor="middle" opacity="0.8">
    {category}
  </text>
</svg>"""

def migrate():
    print("Starting medicine image migration...")
    
    upload_dir = os.path.join(os.path.dirname(__file__), 'static', 'uploads', 'medicines')
    os.makedirs(upload_dir, exist_ok=True)
    
    with app.app_context():
        medicines = Medicine.query.all()
        updated_count = 0
        
        for medicine in medicines:
            # Generate safe filename
            safe_name = "".join([c if c.isalnum() else "_" for c in medicine.name]).lower()
            filename = f"med_{medicine.medicine_id}_{safe_name}.svg"
            file_path = os.path.join(upload_dir, filename)
            
            # Generate and save SVG
            svg_content = generate_svg(medicine.name, medicine.category)
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(svg_content)
                
            # Update database
            image_url = f"/uploads/medicines/{filename}"
            
            if medicine.image_url != image_url:
                medicine.image_url = image_url
                updated_count += 1
                
        db.session.commit()
        
        print(f"Migration complete! Processed {len(medicines)} medicines.")
        print(f"Updated database records for {updated_count} medicines.")
        print(f"All images successfully saved to {upload_dir}")

if __name__ == '__main__':
    migrate()
