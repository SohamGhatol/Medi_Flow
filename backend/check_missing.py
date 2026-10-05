import os
from app import create_app
from models.medicine import Medicine, db

app = create_app()

base = r'c:\Users\soham\Downloads\MEdi FLow\backend\static'
missing = 0

with app.app_context():
    meds = Medicine.query.all()
    for m in meds:
        if m.image_url:
            path = os.path.join(base, m.image_url.strip('/').replace('/', '\\'))
            if not os.path.exists(path):
                print(f"Missing: {m.name} -> {m.image_url}")
                missing += 1
        else:
            print(f"Missing image_url: {m.name}")
            missing += 1
            
print(f'Total missing: {missing}')
