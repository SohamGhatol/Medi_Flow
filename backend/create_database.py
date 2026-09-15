"""
Create the msms_db database in PostgreSQL
"""
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

def create_database():
    try:
        # Connect to PostgreSQL server (default postgres database)
        conn = psycopg2.connect(
            host="localhost",
            user="postgres",
            password="1234",
            database="postgres"  # Connect to default database first
        )
        
        # Set autocommit mode
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        
        # Create cursor
        cursor = conn.cursor()
        
        # Check if database exists
        cursor.execute("SELECT 1 FROM pg_database WHERE datname='msms_db'")
        exists = cursor.fetchone()
        
        if exists:
            print("Database 'msms_db' already exists!")
        else:
            # Create database
            cursor.execute("CREATE DATABASE msms_db")
            print("[SUCCESS] Database 'msms_db' created successfully!")
        
        cursor.close()
        conn.close()
        
        return True
        
    except Exception as e:
        print(f"[ERROR] Error creating database: {e}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("  Medi-Flow Systems - Database Creation")
    print("  Smart Management. Better Health.")
    print("=" * 60)
    print()
    
    if create_database():
        print()
        print("Next steps:")
        print("1. python init_db.py")
        print("2. python chatbot/loader.py")
        print("3. python app.py")
    else:
        print()
        print("Please check your PostgreSQL connection settings.")
