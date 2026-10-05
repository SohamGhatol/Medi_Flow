from app import create_app
from models.medicine import Medicine, db

app = create_app()

with app.app_context():
    m = Medicine.query.filter_by(name='Atorvastatin 20mg').first()
    if m:
        m.image_url = "/uploads/medicines/heart and blood pressure Atorvastatin 20mg by Dr.Reddy's.webp"
        db.session.commit()
        print('Fixed Atorvastatin 20mg')
    else:
        print('Not found')
