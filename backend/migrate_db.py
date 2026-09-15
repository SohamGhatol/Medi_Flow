from app import create_app
from models import db
from sqlalchemy import text

app = create_app()

with app.app_context():
    try:
        db.session.execute(text("ALTER TABLE companies ADD COLUMN lead_time_days INTEGER DEFAULT 5;"))
        db.session.commit()
        print("Added lead_time_days to companies")
    except Exception as e:
        db.session.rollback()
        print("Could not add lead_time_days:", e)

    try:
        db.session.execute(text("ALTER TABLE purchases ADD COLUMN status VARCHAR(50) DEFAULT 'Received';"))
        db.session.commit()
        print("Added status to purchases")
    except Exception as e:
        db.session.rollback()
        print("Could not add status:", e)

    try:
        db.session.execute(text("ALTER TABLE purchases ADD COLUMN expected_date TIMESTAMP;"))
        db.session.commit()
        print("Added expected_date to purchases")
    except Exception as e:
        db.session.rollback()
        print("Could not add expected_date:", e)
        
    print("Migration complete!")
