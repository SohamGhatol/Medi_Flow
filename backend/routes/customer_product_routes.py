from flask import Blueprint, request, jsonify
from models.medicine import Medicine, Company, db
from models.customer import CartItem
from routes.customer_auth_routes import customer_token_required
from datetime import datetime

customer_product_bp = Blueprint('customer_products', __name__)

@customer_product_bp.route('/products', methods=['GET'])
def get_products():
    """Get all available products for customers (public access)"""
    try:
        # Get query parameters
        search = request.args.get('search', '')
        product_type = request.args.get('type')  # 'OTC' or 'Rx'
        category = request.args.get('category')
        company_id = request.args.get('company')
        min_price = request.args.get('min_price', type=float)
        max_price = request.args.get('max_price', type=float)
        sort_by = request.args.get('sort', 'name')  # 'name', 'price_asc', 'price_desc'
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        # Build query - only show in-stock medicines
        query = Medicine.query.join(Company).filter(
            Medicine.quantity > 0,
            Medicine.exp_date > datetime.now().date()
        )
        
        # Apply filters
        if search:
            query = query.filter(
                db.or_(
                    Medicine.name.ilike(f'%{search}%'),
                    Medicine.generic_name.ilike(f'%{search}%'),
                    Company.name.ilike(f'%{search}%'),
                    Medicine.description.ilike(f'%{search}%')
                )
            )
        
        if product_type and product_type in ['OTC', 'Rx']:
            query = query.filter(Medicine.product_type == product_type)
            
        if category:
            query = query.filter(Medicine.category == category)
        
        if company_id:
            query = query.filter(Medicine.company_id == company_id)
        
        if min_price is not None:
            query = query.filter(Medicine.price >= min_price)
        
        if max_price is not None:
            query = query.filter(Medicine.price <= max_price)
        
        # Apply sorting
        if sort_by == 'price_asc':
            query = query.order_by(Medicine.price.asc())
        elif sort_by == 'price_desc':
            query = query.order_by(Medicine.price.desc())
        else:  # default: name
            query = query.order_by(Medicine.name.asc())
        
        # Paginate
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        medicines = pagination.items
        
        result = []
        for med in medicines:
            result.append({
                'medicine_id': med.medicine_id,
                'name': med.name,
                'generic_name': med.generic_name,
                'category': med.category,
                'dosage_form': med.dosage_form,
                'strength': med.strength,
                'company': med.company.name,
                'company_id': med.company_id,
                'price': float(med.price),
                'product_type': med.product_type,
                'description': med.description,
                'image_url': med.image_url,
                'in_stock': med.quantity > 0,
                'available_quantity': med.quantity if med.quantity <= 100 else 100,  # Don't show exact high quantities
                'requires_prescription': med.product_type == 'Rx'
            })
        
        return jsonify({
            'products': result,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': pagination.total,
                'pages': pagination.pages,
                'has_next': pagination.has_next,
                'has_prev': pagination.has_prev
            }
        }), 200
        
    except Exception as e:
        return jsonify({'message': 'Error retrieving products', 'error': str(e)}), 500

@customer_product_bp.route('/products/<int:id>', methods=['GET'])
def get_product_detail(id):
    """Get detailed product information (public access)"""
    try:
        medicine = Medicine.query.get(id)
        
        if not medicine:
            return jsonify({'message': 'Product not found'}), 404
        
        # Check if product is available
        is_available = medicine.quantity > 0 and medicine.exp_date > datetime.now().date()
        
        return jsonify({
            'medicine_id': medicine.medicine_id,
            'name': medicine.name,
            'generic_name': medicine.generic_name,
            'category': medicine.category,
            'dosage_form': medicine.dosage_form,
            'strength': medicine.strength,
            'company': medicine.company.name,
            'company_id': medicine.company_id,
            'batch_no': medicine.batch_no,
            'price': float(medicine.price),
            'product_type': medicine.product_type,
            'description': medicine.description,
            'image_url': medicine.image_url,
            'in_stock': is_available,
            'available_quantity': medicine.quantity if medicine.quantity <= 100 else 100,
            'requires_prescription': medicine.product_type == 'Rx',
            'mfg_date': medicine.mfg_date.isoformat(),
            'exp_date': medicine.exp_date.isoformat(),
            'days_to_expiry': (medicine.exp_date - datetime.now().date()).days
        }), 200
        
    except Exception as e:
        return jsonify({'message': 'Error retrieving product', 'error': str(e)}), 500

@customer_product_bp.route('/products/featured', methods=['GET'])
def get_featured_products():
    """Get featured/popular products"""
    try:
        # Get top 10 OTC medicines (simplified - in production, track sales)
        medicines = Medicine.query.join(Company).filter(
            Medicine.quantity > 0,
            Medicine.exp_date > datetime.now().date(),
            Medicine.product_type == 'OTC'
        ).order_by(Medicine.name.asc()).limit(10).all()
        
        result = []
        for med in medicines:
            result.append({
                'medicine_id': med.medicine_id,
                'name': med.name,
                'company': med.company.name,
                'price': float(med.price),
                'product_type': med.product_type,
                'image_url': med.image_url or '/static/images/medicine-placeholder.png',
                'requires_prescription': False
            })
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({'message': 'Error retrieving featured products', 'error': str(e)}), 500

@customer_product_bp.route('/categories', methods=['GET'])
def get_categories():
    """Get available product categories (companies)"""
    try:
        companies = Company.query.join(Medicine).filter(
            Medicine.quantity > 0
        ).distinct().all()
        
        result = []
        for company in companies:
            # Count available products
            product_count = Medicine.query.filter(
                Medicine.company_id == company.company_id,
                Medicine.quantity > 0,
                Medicine.exp_date > datetime.now().date()
            ).count()
            
            if product_count > 0:
                result.append({
                    'company_id': company.company_id,
                    'name': company.name,
                    'product_count': product_count
                })
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({'message': 'Error retrieving categories', 'error': str(e)}), 500

@customer_product_bp.route('/search-suggestions', methods=['GET'])
def search_suggestions():
    """Get search suggestions for autocomplete"""
    try:
        query = request.args.get('q', '')
        
        if len(query) < 2:
            return jsonify([]), 200
        
        medicines = Medicine.query.filter(
            Medicine.name.ilike(f'%{query}%'),
            Medicine.quantity > 0,
            Medicine.exp_date > datetime.now().date()
        ).limit(5).all()
        
        suggestions = [med.name for med in medicines]
        
        return jsonify(suggestions), 200
        
    except Exception as e:
        return jsonify({'message': 'Error getting suggestions', 'error': str(e)}), 500

@customer_product_bp.route('/check-availability', methods=['POST'])
def check_availability():
    """Check if products are available in requested quantities"""
    try:
        data = request.get_json()
        items = data.get('items', [])  # [{'medicine_id': 1, 'quantity': 2}, ...]
        
        if not items:
            return jsonify({'message': 'No items provided'}), 400
        
        result = []
        all_available = True
        
        for item in items:
            medicine = Medicine.query.get(item['medicine_id'])
            
            if not medicine:
                result.append({
                    'medicine_id': item['medicine_id'],
                    'available': False,
                    'reason': 'Product not found'
                })
                all_available = False
                continue
            
            is_available = (
                medicine.quantity >= item['quantity'] and
                medicine.exp_date > datetime.now().date()
            )
            
            result.append({
                'medicine_id': medicine.medicine_id,
                'name': medicine.name,
                'requested_quantity': item['quantity'],
                'available_quantity': medicine.quantity,
                'available': is_available,
                'reason': None if is_available else 'Insufficient stock' if medicine.quantity < item['quantity'] else 'Product expired'
            })
            
            if not is_available:
                all_available = False
        
        return jsonify({
            'all_available': all_available,
            'items': result
        }), 200
        
    except Exception as e:
        return jsonify({'message': 'Error checking availability', 'error': str(e)}), 500
