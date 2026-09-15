from app import create_app
from models import db

def migrate_v2():
    """Add new pharmacy-specific columns to medicines table"""
    app = create_app()
    
    with app.app_context():
        # Get database connection
        connection = db.engine.connect()
        
        try:
            print("Adding One-Stop Pharmacy columns to medicines table...")
            
            # Check and add category
            result = connection.execute(db.text("""
                SELECT column_name FROM information_schema.columns 
                WHERE table_name='medicines' AND column_name='category'
            """))
            if not result.fetchone():
                connection.execute(db.text("ALTER TABLE medicines ADD COLUMN category VARCHAR(50) DEFAULT 'Uncategorized'"))
                print("Added category column")
            
            # Check and add generic_name
            result = connection.execute(db.text("""
                SELECT column_name FROM information_schema.columns 
                WHERE table_name='medicines' AND column_name='generic_name'
            """))
            if not result.fetchone():
                connection.execute(db.text("ALTER TABLE medicines ADD COLUMN generic_name VARCHAR(100)"))
                print("Added generic_name column")
                
            # Check and add dosage_form
            result = connection.execute(db.text("""
                SELECT column_name FROM information_schema.columns 
                WHERE table_name='medicines' AND column_name='dosage_form'
            """))
            if not result.fetchone():
                connection.execute(db.text("ALTER TABLE medicines ADD COLUMN dosage_form VARCHAR(50)"))
                print("Added dosage_form column")
                
            # Check and add strength
            result = connection.execute(db.text("""
                SELECT column_name FROM information_schema.columns 
                WHERE table_name='medicines' AND column_name='strength'
            """))
            if not result.fetchone():
                connection.execute(db.text("ALTER TABLE medicines ADD COLUMN strength VARCHAR(50)"))
                print("Added strength column")
                
            connection.commit()
            print("\nV2 Database migration completed successfully!")
            
        except Exception as e:
            connection.rollback()
            print(f"Error during migration: {e}")
        finally:
            connection.close()

if __name__ == '__main__':
    migrate_v2()
