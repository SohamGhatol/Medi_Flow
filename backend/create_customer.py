from app import create_app
from models import db
from models.customer import Customer

def create_test_customer():
    app = create_app()
    with app.app_context():
        email = "customer@test.com"
        
        # Check if customer already exists
        existing = Customer.query.filter_by(email=email).first()
        if existing:
            print(f"Customer {email} already exists!")
            # Reset password just in case
            existing.set_password('password123')
            db.session.commit()
            print("Password reset to 'password123'")
            return

        customer = Customer(
            name="Test Customer",
            email=email,
            phone="9876543210",
            address="123 Main Street",
            city="Mumbai",
            state="Maharashtra",
            pincode="400001"
        )
        customer.set_password('password123')
        
        db.session.add(customer)
        db.session.commit()
        print(f"Test customer created successfully! Email: {email}, Password: password123")

if __name__ == '__main__':
    create_test_customer()
