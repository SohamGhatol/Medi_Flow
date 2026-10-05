from flask import Blueprint, request, jsonify
from models.customer import Customer, CartItem, db
from models.medicine import Medicine
from models.order import Order, OrderItem, OrderStatusHistory
from ocr_engine import process_prescription_ocr
from routes.customer_auth_routes import customer_token_required
from services.inventory_service import InventoryService, InsufficientStockError
from datetime import datetime
from werkzeug.utils import secure_filename
import os
import threading

customer_order_bp = Blueprint('customer_orders', __name__)

UPLOAD_FOLDER = 'uploads/prescriptions'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'pdf'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@customer_order_bp.route('/checkout/validate', methods=['POST'])
@customer_token_required
def validate_checkout(current_customer):
    """Validate cart before checkout"""
    try:
        cart_items = CartItem.query.filter_by(customer_id=current_customer.customer_id).all()
        
        if not cart_items:
            return jsonify({'message': 'Cart is empty'}), 400
        
        issues = []
        total = 0
        has_rx_items = False
        
        for item in cart_items:
            medicine = item.medicine
            
            # Check available valid stock
            available_stock = InventoryService.get_available_stock(medicine.medicine_id)
            if available_stock < item.quantity:
                issues.append({
                    'medicine': medicine.name,
                    'issue': f'Only {available_stock} valid units available, but {item.quantity} requested'
                })
            
            # Check if prescription required
            if medicine.product_type == 'Rx':
                has_rx_items = True
            
            total += float(medicine.price) * item.quantity
        
        if issues:
            return jsonify({
                'valid': False,
                'issues': issues
            }), 400
        
        return jsonify({
            'valid': True,
            'total': round(total, 2),
            'requires_prescription': has_rx_items,
            'item_count': len(cart_items)
        }), 200
        
    except Exception as e:
        return jsonify({'message': 'Error validating checkout', 'error': str(e)}), 500

@customer_order_bp.route('/orders/place', methods=['POST'])
@customer_token_required
def place_order(current_customer):
    """Place order with conditional prescription upload"""
    try:
        # Handle both FormData and JSON requests
        if request.content_type and 'multipart/form-data' in request.content_type:
            data = request.form
        else:
            data = request.get_json() or {}
        
        # Get cart items
        cart_items = CartItem.query.filter_by(customer_id=current_customer.customer_id).all()
        
        if not cart_items:
            return jsonify({'message': 'Cart is empty'}), 400
        
        # Calculate total and check for Rx items
        total = 0
        has_rx_items = False
        order_items_data = []
        
        for item in cart_items:
            medicine = item.medicine
            subtotal = float(medicine.price) * item.quantity
            total += subtotal
            
            if medicine.product_type == 'Rx':
                has_rx_items = True
            
            order_items_data.append({
                'medicine': medicine,
                'quantity': item.quantity,
                'unit_price': medicine.price,
                'subtotal': subtotal,
                'product_type': medicine.product_type
            })
        
        # CRITICAL: Check prescription upload if Rx items present
        prescription_file_path = None
        if has_rx_items:
            if 'prescription' not in request.files:
                return jsonify({
                    'message': 'Prescription required',
                    'error': 'Your cart contains prescription medicines. Please upload a valid prescription.'
                }), 400
            
            file = request.files['prescription']
            
            if file.filename == '':
                return jsonify({'message': 'No prescription file selected'}), 400
            
            if not allowed_file(file.filename):
                return jsonify({'message': 'Invalid file type. Allowed: PNG, JPG, JPEG, PDF'}), 400
            
            # Save prescription file
            filename = secure_filename(f"{current_customer.customer_id}_{datetime.now().strftime('%Y%m%d%H%M%S')}_{file.filename}")
            
            # Create upload directory if it doesn't exist
            os.makedirs(UPLOAD_FOLDER, exist_ok=True)
            
            file_path = os.path.join(UPLOAD_FOLDER, filename)
            file.save(file_path)
            prescription_file_path = file_path
        
        # Get shipping address (use customer's default or provided)
        shipping_address = data.get('shipping_address') or current_customer.address
        shipping_city = data.get('shipping_city') or current_customer.city
        shipping_state = data.get('shipping_state') or current_customer.state
        shipping_pincode = data.get('shipping_pincode') or current_customer.pincode
        
        if not shipping_address:
            return jsonify({'message': 'Shipping address required'}), 400
        
        # Create order
        new_order = Order(
            customer_id=current_customer.customer_id,
            total_amount=total,
            status='Pending Review' if has_rx_items else 'Processing',
            payment_method='Cash on Delivery',
            shipping_address=shipping_address,
            shipping_city=shipping_city,
            shipping_state=shipping_state,
            shipping_pincode=shipping_pincode,
            requires_prescription=has_rx_items,
            prescription_uploaded=has_rx_items,
            prescription_file_path=prescription_file_path,
            prescription_status='Pending' if has_rx_items else None
        )
        
        db.session.add(new_order)
        db.session.flush()  # Get order_id
        
        # Create order items and update stock
        for item_data in order_items_data:
            order_item = OrderItem(
                order_id=new_order.order_id,
                medicine_id=item_data['medicine'].medicine_id,
                quantity=item_data['quantity'],
                unit_price=item_data['unit_price'],
                subtotal=item_data['subtotal'],
                product_type=item_data['product_type']
            )
            db.session.add(order_item)
            db.session.flush() # Get order_item_id
            
            # Reduce stock using FEFO batch allocation
            try:
                InventoryService.allocate_stock_fefo(
                    medicine_id=item_data['medicine'].medicine_id,
                    requested_qty=item_data['quantity'],
                    allocation_type='order',
                    reference_id=order_item.order_item_id
                )
            except InsufficientStockError as e:
                db.session.rollback()
                return jsonify({'message': f"Insufficient stock for {item_data['medicine'].name}"}), 400
        
        # Create status history
        status_history = OrderStatusHistory(
            order_id=new_order.order_id,
            status=new_order.status,
            notes='Order placed by customer'
        )
        db.session.add(status_history)
        
        # Trigger OCR asynchronously if a prescription was uploaded
        if prescription_file_path:
            threading.Thread(
                target=process_prescription_ocr,
                args=(new_order.order_id, prescription_file_path)
            ).start()
        
        # Clear cart
        CartItem.query.filter_by(customer_id=current_customer.customer_id).delete()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Order placed successfully',
            'order_id': new_order.order_id,
            'total': float(new_order.total_amount),
            'status': new_order.status,
            'requires_prescription_review': has_rx_items,
            'estimated_delivery': '3-5 business days'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        import traceback
        print("ERROR placing order:")
        print(traceback.format_exc())
        return jsonify({'message': 'Error placing order', 'error': str(e)}), 500

@customer_order_bp.route('/orders', methods=['GET'])
@customer_token_required
def get_orders(current_customer):
    """Get customer's order history"""
    try:
        orders = Order.query.filter_by(customer_id=current_customer.customer_id).order_by(Order.order_date.desc()).all()
        
        result = []
        for order in orders:
            result.append({
                'order_id': order.order_id,
                'order_date': order.order_date.isoformat(),
                'total_amount': float(order.total_amount),
                'status': order.status,
                'payment_method': order.payment_method,
                'item_count': len(order.order_items),
                'requires_prescription': order.requires_prescription,
                'prescription_status': order.prescription_status,
            'delivery_otp': order.delivery_otp,
            })
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({'message': 'Error retrieving orders', 'error': str(e)}), 500

@customer_order_bp.route('/orders/<int:order_id>', methods=['GET'])
@customer_token_required
def get_order_details(current_customer, order_id):
    """Get specific order details"""
    try:
        order = Order.query.filter_by(order_id=order_id, customer_id=current_customer.customer_id).first()
        
        if not order:
            return jsonify({'message': 'Order not found'}), 404
            
        items = []
        for item in order.order_items:
            items.append({
                'medicine_id': item.medicine_id,
                'name': Medicine.query.get(item.medicine_id).name,
                'quantity': item.quantity,
                'unit_price': float(item.unit_price),
                'subtotal': float(item.subtotal),
                'product_type': item.product_type
            })
            
        history = []
        for h in order.status_history:
            history.append({
                'status': h.status,
                'changed_at': h.changed_at.isoformat(),
                'notes': h.notes
            })
            
        return jsonify({
            'order_id': order.order_id,
            'order_date': order.order_date.isoformat(),
            'total_amount': float(order.total_amount),
            'status': order.status,
            'payment_method': order.payment_method,
            'shipping_address': order.shipping_address,
            'shipping_city': order.shipping_city,
            'shipping_state': order.shipping_state,
            'shipping_pincode': order.shipping_pincode,
            'requires_prescription': order.requires_prescription,
            'prescription_uploaded': order.prescription_uploaded,
            'prescription_status': order.prescription_status,
            'delivery_otp': order.delivery_otp,
            'items': items,
            'history': history
        }), 200
    except Exception as e:
        return jsonify({'message': 'Error retrieving order', 'error': str(e)}), 500

from models.prescription_ocr import PrescriptionOCRResult, PrescriptionMedicineExtraction

@customer_order_bp.route('/orders/<int:order_id>/ocr', methods=['GET'])
@customer_token_required
def get_customer_ocr_results(current_customer, order_id):
    """Get OCR results for customer's order"""
    try:
        order = Order.query.filter_by(order_id=order_id, customer_id=current_customer.customer_id).first()
        if not order:
            return jsonify({'message': 'Order not found'}), 404
            
        ocr_result = PrescriptionOCRResult.query.filter_by(order_id=order_id).order_by(PrescriptionOCRResult.created_at.desc()).first()
        if not ocr_result:
            return jsonify({'message': 'No OCR result', 'status': 'NOT_PROCESSED'}), 200
            
        extractions = PrescriptionMedicineExtraction.query.filter_by(ocr_result_id=ocr_result.id).all()
        extraction_data = [{
            'extracted_name': ext.extracted_name,
            'extracted_strength': ext.extracted_strength,
            'extracted_dosage': ext.extracted_dosage,
            'extracted_duration': ext.extracted_duration,
            'match_status': ext.match_status
        } for ext in extractions]
            
        return jsonify({
            'status': ocr_result.processing_status,
            'extractions': extraction_data
        }), 200
    except Exception as e:
        return jsonify({'message': 'Error retrieving OCR', 'error': str(e)}), 500

@customer_order_bp.route('/orders/<int:order_id>/track', methods=['GET'])
@customer_token_required
def track_order(current_customer, order_id):
    """Track order status"""
    try:
        order = Order.query.filter_by(
            order_id=order_id,
            customer_id=current_customer.customer_id
        ).first()
        
        if not order:
            return jsonify({'message': 'Order not found'}), 404
        
        # Define tracking stages
        stages = [
            {'stage': 'Order Placed', 'status': 'Pending Review', 'completed': True},
            {'stage': 'Prescription Verified', 'status': 'Approved', 'completed': order.status in ['Approved', 'Processing', 'Out for Delivery', 'Delivered']},
            {'stage': 'Processing', 'status': 'Processing', 'completed': order.status in ['Processing', 'Out for Delivery', 'Delivered']},
            {'stage': 'Out for Delivery', 'status': 'Out for Delivery', 'completed': order.status in ['Out for Delivery', 'Delivered']},
            {'stage': 'Delivered', 'status': 'Delivered', 'completed': order.status == 'Delivered'}
        ]
        
        # If prescription required, adjust stages
        if not order.requires_prescription:
            stages.pop(1)  # Remove prescription verification stage
        
        return jsonify({
            'order_id': order.order_id,
            'current_status': order.status,
            'tracking_stages': stages,
            'last_updated': order.updated_at.isoformat() if order.updated_at else order.order_date.isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({'message': 'Error tracking order', 'error': str(e)}), 500

@customer_order_bp.route('/orders/<int:order_id>/cancel', methods=['POST'])
@customer_token_required
def cancel_order(current_customer, order_id):
    """Cancel order (only if not yet processed)"""
    try:
        order = Order.query.filter_by(
            order_id=order_id,
            customer_id=current_customer.customer_id
        ).first()
        
        if not order:
            return jsonify({'message': 'Order not found'}), 404
        
        # Can only cancel if pending or approved
        if order.status not in ['Pending Review', 'Approved']:
            return jsonify({'message': 'Order cannot be cancelled at this stage'}), 400
        
        # Restore stock
        for item in order.order_items:
            medicine = Medicine.query.get(item.medicine_id)
            if medicine:
                medicine.quantity += item.quantity
        
        # Update order status
        order.status = 'Cancelled'
        
        # Add to history
        status_history = OrderStatusHistory(
            order_id=order.order_id,
            status='Cancelled',
            notes='Cancelled by customer'
        )
        db.session.add(status_history)
        
        db.session.commit()
        
        return jsonify({'message': 'Order cancelled successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Error cancelling order', 'error': str(e)}), 500
