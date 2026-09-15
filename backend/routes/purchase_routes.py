from flask import Blueprint, request, jsonify
from models.purchase import Purchase, db
from models.medicine import Medicine
from routes.auth_routes import token_required, role_required
from datetime import datetime

purchase_bp = Blueprint('purchases', __name__)

@purchase_bp.route('/', methods=['GET'])
@token_required
def get_purchases(current_user):
    """Get all purchases with optional filtering"""
    try:
        # Get query parameters
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        medicine_id = request.args.get('medicine_id')
        
        # Build query
        query = Purchase.query
        
        if start_date:
            start = datetime.strptime(start_date, '%Y-%m-%d')
            query = query.filter(Purchase.date >= start)
        
        if end_date:
            end = datetime.strptime(end_date, '%Y-%m-%d')
            query = query.filter(Purchase.date <= end)
        
        if medicine_id:
            query = query.filter(Purchase.medicine_id == medicine_id)
        
        purchases = query.all()
        
        result = []
        for purchase in purchases:
            result.append({
                'purchase_id': purchase.purchase_id,
                'supplier_id': purchase.supplier_id,
                'medicine_id': purchase.medicine_id,
                'medicine_name': purchase.medicine.name,
                'quantity': purchase.quantity,
                'cost_price': float(purchase.cost_price),
                'total': float(purchase.total),
                'invoice_no': purchase.invoice_no,
                'date': purchase.date.isoformat(),
                'status': purchase.status,
                'expected_date': purchase.expected_date.isoformat() if purchase.expected_date else None
            })
        
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'message': 'Error retrieving purchases', 'error': str(e)}), 500

@purchase_bp.route('/', methods=['POST'])
@token_required
@role_required('Admin')
def create_purchase(current_user):
    """Create a new purchase (Admin only)"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['supplier_id', 'medicine_id', 'quantity', 'cost_price', 'invoice_no', 'batch_no']
        for field in required_fields:
            if field not in data:
                return jsonify({'message': f'Missing required field: {field}'}), 400
        
        # Check if medicine exists
        medicine = Medicine.query.get(data['medicine_id'])
        if not medicine:
            # If medicine doesn't exist, create it
            return jsonify({'message': 'Medicine not found. Please create medicine first.'}), 404
        
        # Calculate total
        total = data['cost_price'] * data['quantity']
        
        # Get status and expected_date
        status = data.get('status', 'Received')
        expected_date = data.get('expected_date')
        if expected_date:
            expected_date = datetime.strptime(expected_date, '%Y-%m-%d')
            
        mfg_date = data.get('mfg_date')
        if mfg_date:
            mfg_date = datetime.strptime(mfg_date, '%Y-%m-%d').date()
            
        exp_date = data.get('exp_date')
        if exp_date:
            exp_date = datetime.strptime(exp_date, '%Y-%m-%d').date()
            if exp_date < datetime.utcnow().date():
                return jsonify({'message': 'Cannot receive expired batch stock!'}), 400
        else:
            return jsonify({'message': 'Missing required field: exp_date'}), 400
        
        if mfg_date and exp_date and mfg_date > exp_date:
            return jsonify({'message': 'Manufacturing date cannot be after expiry date!'}), 400
        
        # Create new purchase
        new_purchase = Purchase(
            supplier_id=data['supplier_id'],
            medicine_id=data['medicine_id'],
            quantity=data['quantity'],
            cost_price=data['cost_price'],
            total=total,
            invoice_no=data['invoice_no'],
            status=status,
            expected_date=expected_date
        )
        
        db.session.add(new_purchase)
        
        # If status is Received, we create the new batch
        if status == 'Received':
            from models.batch import MedicineBatch
            
            # Check for existing batch to prevent accidental duplicates
            existing_batch = MedicineBatch.query.filter_by(
                medicine_id=data['medicine_id'],
                batch_no=data['batch_no']
            ).first()
            
            if existing_batch:
                return jsonify({'message': f"Batch number {data['batch_no']} already exists for this medicine."}), 400
                
            new_batch = MedicineBatch(
                medicine_id=data['medicine_id'],
                batch_no=data['batch_no'],
                mfg_date=mfg_date,
                exp_date=exp_date,
                quantity=data['quantity'],
                status='ACTIVE'
            )
            db.session.add(new_batch)
            
            # Update aggregate Medicine quantity
            medicine.quantity += data['quantity']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Purchase created successfully',
            'purchase_id': new_purchase.purchase_id,
            'total': float(total)
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Error creating purchase', 'error': str(e)}), 500

@purchase_bp.route('/<int:id>', methods=['GET'])
@token_required
def get_purchase(current_user, id):
    """Get a specific purchase by ID"""
    try:
        purchase = Purchase.query.get(id)
        if not purchase:
            return jsonify({'message': 'Purchase not found'}), 404
        
        return jsonify({
            'purchase_id': purchase.purchase_id,
            'supplier_id': purchase.supplier_id,
            'medicine_id': purchase.medicine_id,
            'medicine_name': purchase.medicine.name,
            'quantity': purchase.quantity,
            'cost_price': float(purchase.cost_price),
            'total': float(purchase.total),
            'invoice_no': purchase.invoice_no,
            'date': purchase.date.isoformat(),
            'status': purchase.status,
            'expected_date': purchase.expected_date.isoformat() if purchase.expected_date else None
        }), 200
    except Exception as e:
        return jsonify({'message': 'Error retrieving purchase', 'error': str(e)}), 500

@purchase_bp.route('/<int:id>/status', methods=['PUT'])
@token_required
@role_required('Admin')
def update_purchase_status(current_user, id):
    """Update purchase status (e.g. mark as received)"""
    try:
        purchase = Purchase.query.get(id)
        if not purchase:
            return jsonify({'message': 'Purchase not found'}), 404
            
        data = request.get_json()
        new_status = data.get('status')
        
        if not new_status or new_status not in ['Pending', 'Received', 'Cancelled']:
            return jsonify({'message': 'Invalid status'}), 400
            
        # If changing from Pending to Received, increment stock
        if purchase.status == 'Pending' and new_status == 'Received':
            medicine = Medicine.query.get(purchase.medicine_id)
            if medicine:
                medicine.quantity += purchase.quantity
                
        # If changing from Received to Pending/Cancelled (undo), decrement stock
        elif purchase.status == 'Received' and new_status in ['Pending', 'Cancelled']:
            medicine = Medicine.query.get(purchase.medicine_id)
            if medicine:
                medicine.quantity -= purchase.quantity
                
        purchase.status = new_status
        db.session.commit()
        
        return jsonify({
            'message': f'Purchase marked as {new_status}',
            'status': purchase.status
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Error updating purchase status', 'error': str(e)}), 500