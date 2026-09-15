import json
import os
import sys

# Ensure backend directory is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from models.chatbot_kb import ChatbotKB, db

def load_drugs_to_db():
    """Load drugs from JSON file to database"""
    app = create_app()
    with app.app_context():
        try:
            # Get the directory of this script
            script_dir = os.path.dirname(os.path.abspath(__file__))
            json_path = os.path.join(script_dir, '..', 'drugs.json')
            
            # Read the JSON file
            with open(json_path, 'r', encoding='utf-8') as f:
                drugs_data = json.load(f)
            
            # Clear existing data
            ChatbotKB.query.delete()
            
            # Load drugs into database
            for drug in drugs_data:
                drug_entry = ChatbotKB(
                    drug_id=drug['drug_id'],
                    name=drug['name'],
                    data=drug
                )
                db.session.add(drug_entry)
            
            db.session.commit()
            print(f"Successfully loaded {len(drugs_data)} drugs into the database")
            return True
        except Exception as e:
            db.session.rollback()
            print(f"Error loading drugs: {str(e)}")
            return False

if __name__ == '__main__':
    load_drugs_to_db()