from flask import Blueprint, request, jsonify, send_file
from sqlalchemy import or_
from models.order import Order, OrderItem, OrderStatusHistory, db
from models.customer import Customer
from models.user import User
from models.prescription_ocr import PrescriptionOCRResult, PrescriptionMedicineExtraction
from routes.auth_routes import token_required, role_required
from datetime import datetime
import os
import random

staff_order_bp = Blueprint('staff_orders', __name__)

@staff_order_bp.route('/online-orders', methods=['GET'])
@token_required
def get_online_orders(current_user):
    """Get all online customer orders (Staff/Admin access)"""
    try:
        # Get query parameters
        status = request.args.get('status')
        requires_review = request.args.get('requires_review', type=bool)
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        search_query = request.args.get('search')
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        # Build query
        query = Order.query
        
        if start_date:
            try:
                # Assuming start_date is YYYY-MM-DD
                parsed_start = datetime.strptime(start_date, '%Y-%m-%d')
                query = query.filter(Order.order_date >= parsed_start)
            except ValueError:
                pass
                
        if end_date:
            try:
                # Set time to end of day
                parsed_end = datetime.strptime(end_date, '%Y-%m-%d')
                parsed_end = parsed_end.replace(hour=23, minute=59, second=59)
                query = query.filter(Order.order_date <= parsed_end)
            except ValueError:
                pass
        
        
        if status:
            query = query.filter(Order.status == status)
        
        if requires_review:
            query = query.filter(
                Order.requires_prescription == True,
                Order.prescription_status == 'Pending'
            )
            
        if search_query:
            # Check if search_query is an integer for order_id
            try:
                order_id_search = int(search_query)
                query = query.join(Customer).filter(
                    or_(
                        Order.order_id == order_id_search,
                        Customer.name.ilike(f'%{search_query}%'),
                        Customer.email.ilike(f'%{search_query}%')
                    )
                )
            except ValueError:
                query = query.join(Customer).filter(
                    or_(
                        Customer.name.ilike(f'%{search_query}%'),
                        Customer.email.ilike(f'%{search_query}%')
                    )
                )
        
        # Order by date (newest first)
        query = query.order_by(Order.order_date.desc())
        
        # Paginate
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        orders = pagination.items
        
        result = []
        for order in orders:
            customer = Customer.query.get(order.customer_id)
            
            result.append({
                'order_id': order.order_id,
                'customer_name': customer.name if customer else 'Unknown',
                'customer_email': customer.email if customer else 'Unknown',
                'customer_phone': customer.phone if customer else 'Unknown',
                'order_date': order.order_date.isoformat(),
                'total_amount': float(order.total_amount),
                'status': order.status,
                'payment_method': order.payment_method,
                'item_count': len(order.order_items),
                'requires_prescription': order.requires_prescription,
                'prescription_uploaded': order.prescription_uploaded,
                'prescription_status': order.prescription_status,
                'prescription_file_path': order.prescription_file_path,
                'needs_review': order.requires_prescription and order.prescription_status == 'Pending'
            })
        
        return jsonify({
            'orders': result,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': pagination.total,
                'pages': pagination.pages
            }
        }), 200
        
    except Exception as e:
        return jsonify({'message': 'Error retrieving orders', 'error': str(e)}), 500

@staff_order_bp.route('/online-orders/<int:order_id>', methods=['GET'])
@token_required
def get_online_order_detail(current_user, order_id):
    """Get detailed order information for staff"""
    try:
        order = Order.query.get(order_id)
        
        if not order:
            return jsonify({'message': 'Order not found'}), 404
        
        customer = Customer.query.get(order.customer_id)
        
        # Get order items
        items = []
        for item in order.order_items:
            items.append({
                'order_item_id': item.order_item_id,
                'medicine_id': item.medicine_id,
                'medicine_name': item.medicine.name,
                'company': item.medicine.company.name,
                'batch_no': item.medicine.batch_no,
                'quantity': item.quantity,
                'unit_price': float(item.unit_price),
                'subtotal': float(item.subtotal),
                'product_type': item.product_type
            })
        
        # Get status history
        history = []
        for status in order.status_history:
            reviewer = User.query.get(status.changed_by) if status.changed_by else None
            history.append({
                'status': status.status,
                'changed_at': status.changed_at.isoformat(),
                'changed_by': reviewer.username if reviewer else 'System',
                'notes': status.notes
            })
        
        return jsonify({
            'order_id': order.order_id,
            'order_date': order.order_date.isoformat(),
            'customer': {
                'customer_id': customer.customer_id,
                'name': customer.name,
                'email': customer.email,
                'phone': customer.phone
            },
            'total_amount': float(order.total_amount),
            'status': order.status,
            'payment_method': order.payment_method,
            'shipping_address': order.shipping_address,
            'shipping_city': order.shipping_city,
            'shipping_state': order.shipping_state,
            'shipping_pincode': order.shipping_pincode,
            'requires_prescription': order.requires_prescription,
            'prescription_uploaded': order.prescription_uploaded,
            'prescription_file_path': order.prescription_file_path,
            'prescription_status': order.prescription_status,
            'staff_notes': order.staff_notes,
            'items': items,
            'status_history': history
        }), 200
        
    except Exception as e:
        return jsonify({'message': 'Error retrieving order', 'error': str(e)}), 500

@staff_order_bp.route('/online-orders/<int:order_id>/prescription', methods=['GET'])
@token_required
def view_prescription(current_user, order_id):
    """View uploaded prescription file"""
    try:
        order = Order.query.get(order_id)
        
        if not order:
            return jsonify({'message': 'Order not found'}), 404
        
        if not order.prescription_file_path:
            return jsonify({'message': 'No prescription uploaded'}), 404
        
        if not os.path.exists(order.prescription_file_path):
            return jsonify({'message': 'Prescription file not found'}), 404
        
        return send_file(order.prescription_file_path)
        
    except Exception as e:
        return jsonify({'message': 'Error retrieving prescription', 'error': str(e)}), 500

@staff_order_bp.route('/online-orders/<int:order_id>/review-prescription', methods=['POST'])
@token_required
@role_required('Admin')
def review_prescription(current_user, order_id):
    """Approve or reject prescription (Admin only)"""
    try:
        data = request.get_json()
        
        if 'action' not in data or data['action'] not in ['approve', 'reject']:
            return jsonify({'message': 'Action must be "approve" or "reject"'}), 400
        
        order = Order.query.get(order_id)
        
        if not order:
            return jsonify({'message': 'Order not found'}), 404
        
        if not order.requires_prescription:
            return jsonify({'message': 'Order does not require prescription'}), 400
        
        if order.prescription_status != 'Pending':
            return jsonify({'message': 'Prescription already reviewed'}), 400
        
        action = data['action']
        notes = data.get('notes', '')
        
        if action == 'approve':
            order.prescription_status = 'Approved'
            order.status = 'Processing'
            status_message = 'Prescription approved, order processing'
        else:  # reject
            order.prescription_status = 'Rejected'
            order.status = 'Rejected'
            status_message = 'Prescription rejected'
            
            if not notes:
                return jsonify({'message': 'Rejection reason required in notes'}), 400
        
        order.reviewed_by = current_user.user_id
        order.reviewed_at = datetime.utcnow()
        order.staff_notes = notes
        
        # Add to status history
        status_history = OrderStatusHistory(
            order_id=order.order_id,
            status=order.status,
            changed_by=current_user.user_id,
            notes=f'{status_message}. {notes}' if notes else status_message
        )
        db.session.add(status_history)
        
        db.session.commit()
        
        return jsonify({
            'message': f'Prescription {action}d successfully',
            'order_status': order.status,
            'prescription_status': order.prescription_status
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Error reviewing prescription', 'error': str(e)}), 500

@staff_order_bp.route('/online-orders/<int:order_id>/ocr', methods=['GET'])
@token_required
def get_ocr_results(current_user, order_id):
    """Get the OCR results for a prescription order"""
    try:
        ocr_result = PrescriptionOCRResult.query.filter_by(order_id=order_id).order_by(PrescriptionOCRResult.created_at.desc()).first()
        
        if not ocr_result:
            return jsonify({'message': 'No OCR result found for this order', 'status': 'NOT_PROCESSED'}), 200
            
        extractions = PrescriptionMedicineExtraction.query.filter_by(ocr_result_id=ocr_result.id).all()
        
        extraction_data = []
        for ext in extractions:
            extraction_data.append({
                'id': ext.id,
                'medicine_id': ext.medicine_id,
                'extracted_name': ext.extracted_name,
                'extracted_strength': ext.extracted_strength,
                'extracted_dosage': ext.extracted_dosage,
                'extracted_duration': ext.extracted_duration,
                'confidence_score': ext.confidence_score,
                'match_status': ext.match_status
            })
            
        return jsonify({
            'status': ocr_result.processing_status,
            'raw_text': ocr_result.raw_ocr_text,
            'overall_confidence': ocr_result.overall_confidence,
            'extractions': extraction_data,
            'processed_at': ocr_result.updated_at.isoformat()
        }), 200
    except Exception as e:
        return jsonify({'message': 'Error retrieving OCR results', 'error': str(e)}), 500

@staff_order_bp.route('/online-orders/<int:order_id>/ocr/confirm', methods=['POST'])
@token_required
def confirm_ocr_results(current_user, order_id):
    """Confirm or update OCR extractions (Manual Verification)"""
    data = request.json
    try:
        ocr_result = PrescriptionOCRResult.query.filter_by(order_id=order_id).order_by(PrescriptionOCRResult.created_at.desc()).first()
        if not ocr_result:
            return jsonify({'message': 'OCR result not found'}), 404
            
        # Optional: Save modifications sent by staff.
        # For simplicity, we just mark it VERIFIED.
        ocr_result.processing_status = 'VERIFIED'
        db.session.commit()
        
        return jsonify({'message': 'OCR results verified successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Error verifying OCR results', 'error': str(e)}), 500

# Update Order Status (General)
@staff_order_bp.route('/online-orders/<int:order_id>/status', methods=['PUT'])
@token_required
def update_order_status(current_user, order_id):
    """Update order status"""
    try:
        data = request.get_json()
        
        if 'status' not in data:
            return jsonify({'message': 'Status required'}), 400
        if not data['status'] or len(data['status']) > 20:
            return jsonify({'message': 'Status is required and must be under 20 characters'}), 400
        
        order = Order.query.get(order_id)
        
        if not order:
            return jsonify({'message': 'Order not found'}), 404
        
        # Prevent status change if prescription pending
        if order.requires_prescription and order.prescription_status == 'Pending' and data['status'] not in ['Rejected', 'Cancelled']:
            return jsonify({'message': 'Cannot update status until prescription is reviewed'}), 400
            
        if data['status'] == 'Delivered':
            provided_otp = data.get('otp')
            if not provided_otp or provided_otp != order.delivery_otp:
                return jsonify({'message': 'Invalid OTP', 'code': 'INVALID_OTP'}), 400
        
        old_status = order.status
        order.status = data['status']
        
        if order.status == 'Out for Delivery' and old_status != 'Out for Delivery':
            order.delivery_otp = str(random.randint(1000, 9999))
            
        notes = data.get('notes', f'Status changed from {old_status} to {data["status"]}')
        
        # Add to status history
        status_history = OrderStatusHistory(
            order_id=order.order_id,
            status=data['status'],
            changed_by=current_user.user_id,
            notes=notes
        )
        db.session.add(status_history)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Order status updated successfully',
            'order_id': order.order_id,
            'status': order.status
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Error updating status', 'error': str(e)}), 500

@staff_order_bp.route('/online-orders/<int:order_id>/add-note', methods=['POST'])
@token_required
def add_staff_note(current_user, order_id):
    """Add staff note to order"""
    try:
        data = request.get_json()
        
        if 'note' not in data:
            return jsonify({'message': 'Note required'}), 400
        
        order = Order.query.get(order_id)
        
        if not order:
            return jsonify({'message': 'Order not found'}), 404
        
        # Append to existing notes
        timestamp = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')
        new_note = f"[{timestamp}] {current_user.username}: {data['note']}"
        
        if order.staff_notes:
            order.staff_notes += f"\n{new_note}"
        else:
            order.staff_notes = new_note
        
        db.session.commit()
        
        return jsonify({'message': 'Note added successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Error adding note', 'error': str(e)}), 500

@staff_order_bp.route('/online-orders/stats', methods=['GET'])
@token_required
def get_order_stats(current_user):
    """Get online order statistics"""
    try:
        total_orders = Order.query.count()
        pending_review = Order.query.filter_by(prescription_status='Pending').count()
        processing = Order.query.filter_by(status='Processing').count()
        out_for_delivery = Order.query.filter_by(status='Out for Delivery').count()
        delivered = Order.query.filter_by(status='Delivered').count()
        
        # Today's orders
        today = datetime.utcnow().date()
        today_orders = Order.query.filter(
            db.func.date(Order.order_date) == today
        ).count()
        
        # Total revenue
        total_revenue = db.session.query(
            db.func.sum(Order.total_amount)
        ).filter(Order.status.in_(['Processing', 'Out for Delivery', 'Delivered'])).scalar() or 0
        
        return jsonify({
            'total_orders': total_orders,
            'pending_review': pending_review,
            'processing': processing,
            'out_for_delivery': out_for_delivery,
            'delivered': delivered,
            'today_orders': today_orders,
            'total_revenue': float(total_revenue)
        }), 200
        
    except Exception as e:
        return jsonify({'message': 'Error retrieving stats', 'error': str(e)}), 500

@staff_order_bp.route('/online-orders/<int:order_id>/regenerate-otp', methods=['POST'])
@token_required
def regenerate_order_otp(current_user, order_id):
    """Regenerate delivery OTP"""
    try:
        order = Order.query.get(order_id)
        if not order:
            return jsonify({'message': 'Order not found'}), 404
            
        if order.status != 'Out for Delivery':
            return jsonify({'message': 'Order is not Out for Delivery'}), 400
            
        order.delivery_otp = str(random.randint(1000, 9999))
        db.session.commit()
        
        return jsonify({'message': 'OTP regenerated successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Error regenerating OTP', 'error': str(e)}), 500
