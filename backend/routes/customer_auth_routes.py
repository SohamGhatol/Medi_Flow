from flask import Blueprint, request, jsonify
from models.customer import Customer, db
from datetime import datetime, timedelta
import jwt
from functools import wraps
import os

customer_auth_bp = Blueprint('customer_auth', __name__)

SECRET_KEY = os.environ.get('SECRET_KEY', 'your-secret-key-here')

def customer_token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        
        if not token:
            return jsonify({'message': 'Token is missing'}), 401
        
        try:
            if token.startswith('Bearer '):
                token = token.split(' ')[1]
            
            data = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
            current_customer = Customer.query.get(data['customer_id'])
            
            if not current_customer or not current_customer.is_active:
                return jsonify({'message': 'Invalid or inactive customer'}), 401
                
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'message': 'Invalid token'}), 401
        
        return f(current_customer, *args, **kwargs)
    
    return decorated

import re

@customer_auth_bp.route('/register', methods=['POST'])
def register():
    """Customer registration"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'email', 'phone', 'password', 'address']
        for field in required_fields:
            if field not in data or not str(data[field]).strip():
                return jsonify({'message': f'Missing required field: {field}'}), 400
        
        name = data['name'].strip()
        email = data['email'].strip().lower()
        phone = data['phone'].strip()
        password = data['password']
        address = data['address'].strip()
        pincode = str(data.get('pincode', '')).strip() if data.get('pincode') else None

        # Length and Format Validations
        if len(name) < 2 or len(name) > 100:
            return jsonify({'message': 'Name must be between 2 and 100 characters'}), 400
            
        if not re.match(r'^[\w\.-]+@[\w\.-]+\.\w+$', email):
            return jsonify({'message': 'Invalid email format'}), 400
            
        if not re.match(r'^[6-9]\d{9}$', phone) and not re.match(r'^\d{10}$', phone):
            return jsonify({'message': 'Please enter a valid 10-digit mobile number'}), 400
            
        if pincode and not re.match(r'^\d{6}$', pincode):
            return jsonify({'message': 'Please enter a valid 6-digit pincode'}), 400
            
        # Password Strength Validation
        if (len(password) < 8 or 
            not re.search(r'[A-Z]', password) or 
            not re.search(r'[a-z]', password) or 
            not re.search(r'\d', password) or 
            not re.search(r'[^A-Za-z0-9]', password)):
            return jsonify({'message': 'Password must be at least 8 characters and contain uppercase, lowercase, number, and special character'}), 400

        # Check if email already exists
        if Customer.query.filter_by(email=email).first():
            return jsonify({'message': 'An account with this email already exists. Please sign in instead.'}), 409
        
        # Create new customer
        new_customer = Customer(
            name=name,
            email=email,
            phone=phone,
            address=address,
            city=str(data.get('city', '')).strip() if data.get('city') else None,
            state=str(data.get('state', '')).strip() if data.get('state') else None,
            pincode=pincode
        )
        new_customer.set_password(password)
        
        db.session.add(new_customer)
        db.session.commit()
        
        return jsonify({
            'message': 'Registration successful! Please login.',
            'customer_id': new_customer.customer_id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Registration failed', 'error': str(e)}), 500

@customer_auth_bp.route('/login', methods=['POST'])
def login():
    """Customer login"""
    try:
        data = request.get_json()
        
        email = str(data.get('email', '')).strip().lower()
        password = data.get('password')
        
        if not email or not password:
            return jsonify({'message': 'Invalid email or password'}), 400
        
        customer = Customer.query.filter_by(email=email).first()
        
        if not customer or not customer.check_password(password):
            return jsonify({'message': 'Invalid email or password'}), 401
        
        if not customer.is_active:
            return jsonify({'message': 'Your account is currently unavailable. Please contact support.'}), 401
        
        # Generate JWT token
        token = jwt.encode({
            'customer_id': customer.customer_id,
            'email': customer.email,
            'exp': datetime.utcnow() + timedelta(days=7)
        }, SECRET_KEY, algorithm='HS256')
        
        return jsonify({
            'message': 'Login successful',
            'token': token,
            'customer': {
                'customer_id': customer.customer_id,
                'name': customer.name,
                'email': customer.email,
                'phone': customer.phone,
                'address': customer.address,
                'city': customer.city,
                'state': customer.state,
                'pincode': customer.pincode
            }
        }), 200
        
    except Exception as e:
        return jsonify({'message': 'Login failed. Please try again later.'}), 500

@customer_auth_bp.route('/profile', methods=['GET'])
@customer_token_required
def get_profile(current_customer):
    """Get customer profile"""
    return jsonify({
        'customer_id': current_customer.customer_id,
        'name': current_customer.name,
        'email': current_customer.email,
        'phone': current_customer.phone,
        'address': current_customer.address,
        'city': current_customer.city,
        'state': current_customer.state,
        'pincode': current_customer.pincode,
        'created_at': current_customer.created_at.isoformat()
    }), 200

@customer_auth_bp.route('/profile', methods=['PUT'])
@customer_token_required
def update_profile(current_customer):
    """Update customer profile"""
    try:
        data = request.get_json()
        
        # Update allowed fields
        if 'name' in data:
            current_customer.name = data['name']
        if 'phone' in data:
            current_customer.phone = data['phone']
        if 'address' in data:
            current_customer.address = data['address']
        if 'city' in data:
            current_customer.city = data['city']
        if 'state' in data:
            current_customer.state = data['state']
        if 'pincode' in data:
            current_customer.pincode = data['pincode']
        
        db.session.commit()
        
        return jsonify({'message': 'Profile updated successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Update failed', 'error': str(e)}), 500

@customer_auth_bp.route('/change-password', methods=['POST'])
@customer_token_required
def change_password(current_customer):
    """Change customer password"""
    try:
        data = request.get_json()
        
        if not data.get('current_password') or not data.get('new_password'):
            return jsonify({'message': 'Current and new password required'}), 400
        
        if not current_customer.check_password(data['current_password']):
            return jsonify({'message': 'Current password is incorrect'}), 401
        
        current_customer.set_password(data['new_password'])
        db.session.commit()
        
        return jsonify({'message': 'Password changed successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Password change failed', 'error': str(e)}), 500

@customer_auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    """Forgot password - Send reset link (simplified for prototype)"""
    try:
        data = request.get_json()
        
        if not data.get('email'):
            return jsonify({'message': 'Email required'}), 400
        
        customer = Customer.query.filter_by(email=data['email'].lower()).first()
        
        if not customer:
            # Don't reveal if email exists or not
            return jsonify({'message': 'If email exists, reset link will be sent'}), 200
        
        # Generate reset token (valid for 1 hour)
        reset_token = jwt.encode({
            'customer_id': customer.customer_id,
            'purpose': 'password_reset',
            'exp': datetime.utcnow() + timedelta(hours=1)
        }, SECRET_KEY, algorithm='HS256')
        
        # In production, send email with reset link
        # For prototype, return token directly
        return jsonify({
            'message': 'Password reset token generated',
            'reset_token': reset_token,
            'note': 'In production, this would be sent via email'
        }), 200
        
    except Exception as e:
        return jsonify({'message': 'Request failed', 'error': str(e)}), 500

@customer_auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    """Reset password using token"""
    try:
        data = request.get_json()
        
        if not data.get('reset_token') or not data.get('new_password'):
            return jsonify({'message': 'Reset token and new password required'}), 400
        
        # Verify reset token
        try:
            token_data = jwt.decode(data['reset_token'], SECRET_KEY, algorithms=['HS256'])
            
            if token_data.get('purpose') != 'password_reset':
                return jsonify({'message': 'Invalid reset token'}), 401
            
            customer = Customer.query.get(token_data['customer_id'])
            
            if not customer:
                return jsonify({'message': 'Customer not found'}), 404
            
            customer.set_password(data['new_password'])
            db.session.commit()
            
            return jsonify({'message': 'Password reset successful'}), 200
            
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Reset token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'message': 'Invalid reset token'}), 401
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Password reset failed', 'error': str(e)}), 500
