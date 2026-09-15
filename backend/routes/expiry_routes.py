from flask import Blueprint, jsonify, request
from models.batch import MedicineBatch, db
from models.medicine import Medicine
from models.sale import Sale
from services.inventory_service import InventoryService
from routes.auth_routes import token_required, role_required
from sqlalchemy import func
from datetime import datetime, timedelta

expiry_bp = Blueprint('expiry', __name__)

@expiry_bp.route('/alerts', methods=['GET'])
@token_required
def get_expiry_alerts(current_user):
    """Get batch expiry intelligence and alerts"""
    try:
        # Get active or unknown expiry batches
        batches = MedicineBatch.query.filter(
            MedicineBatch.quantity > 0,
            MedicineBatch.status.in_(['ACTIVE', 'UNKNOWN_EXPIRY', 'EXPIRED'])
        ).all()
        
        results = []
        metrics = {
            'total_value_at_risk': 0.0,
            'expired_count': 0,
            'critical_count': 0,
            'high_count': 0,
            'medium_count': 0,
            'safe_count': 0,
            'insufficient_data_count': 0
        }
        
        now = datetime.utcnow().date()
        thirty_days_ago = now - timedelta(days=30)
        
        for batch in batches:
            medicine = batch.medicine
            risk_info = InventoryService.get_expiry_risk(batch)
            
            # Simple Demand Prediction (last 30 days of sales)
            # Find total quantity of this medicine sold in last 30 days
            recent_sales = db.session.query(func.sum(Sale.quantity)).filter(
                Sale.medicine_id == medicine.medicine_id,
                Sale.date >= datetime.combine(thirty_days_ago, datetime.min.time())
            ).scalar() or 0
            
            daily_demand = float(recent_sales) / 30.0 if recent_sales > 0 else 0.0
            
            estimated_stock_at_expiry = None
            value_at_risk = 0.0
            
            if risk_info['days_remaining'] is not None and risk_info['days_remaining'] > 0:
                if daily_demand > 0:
                    estimated_consumption = daily_demand * risk_info['days_remaining']
                    estimated_stock_at_expiry = max(0, batch.quantity - estimated_consumption)
                    value_at_risk = estimated_stock_at_expiry * float(medicine.price)
                else:
                    estimated_stock_at_expiry = batch.quantity
                    value_at_risk = batch.quantity * float(medicine.price)
                    risk_info['risk_level'] = 'INSUFFICIENT_DATA'
            elif risk_info['risk_level'] == 'EXPIRED':
                estimated_stock_at_expiry = batch.quantity
                value_at_risk = batch.quantity * float(medicine.price)
            
            # Aggregate metrics
            metrics['total_value_at_risk'] += value_at_risk
            
            r_level = risk_info['risk_level']
            if r_level == 'EXPIRED': metrics['expired_count'] += 1
            elif r_level == 'CRITICAL': metrics['critical_count'] += 1
            elif r_level == 'HIGH': metrics['high_count'] += 1
            elif r_level == 'MEDIUM': metrics['medium_count'] += 1
            elif r_level == 'SAFE': metrics['safe_count'] += 1
            elif r_level == 'INSUFFICIENT_DATA': metrics['insufficient_data_count'] += 1
            elif r_level == 'UNKNOWN': metrics['insufficient_data_count'] += 1
            
            results.append({
                'batch_id': batch.batch_id,
                'medicine_name': medicine.name,
                'batch_no': batch.batch_no,
                'mfg_date': batch.mfg_date.isoformat() if batch.mfg_date else None,
                'exp_date': batch.exp_date.isoformat() if batch.exp_date else None,
                'current_quantity': batch.quantity,
                'days_remaining': risk_info['days_remaining'],
                'risk_level': r_level,
                'status': risk_info['status'],
                'daily_demand': round(daily_demand, 2),
                'estimated_stock_at_expiry': round(estimated_stock_at_expiry) if estimated_stock_at_expiry is not None else None,
                'value_at_risk': round(value_at_risk, 2)
            })
            
        return jsonify({
            'metrics': metrics,
            'batches': results
        }), 200
    except Exception as e:
        return jsonify({'message': 'Error retrieving expiry alerts', 'error': str(e)}), 500

@expiry_bp.route('/reconciliation', methods=['GET'])
@token_required
@role_required('Admin')
def get_reconciliation(current_user):
    try:
        medicines = Medicine.query.all()
        discrepancies = []
        for medicine in medicines:
            calc_stock = InventoryService.get_available_stock(medicine.medicine_id)
            if calc_stock != medicine.quantity:
                discrepancies.append({
                    'medicine_id': medicine.medicine_id,
                    'medicine_name': medicine.name,
                    'aggregate_quantity': medicine.quantity,
                    'batch_quantity': calc_stock,
                    'difference': medicine.quantity - calc_stock
                })
        return jsonify({
            'status': 'OK' if not discrepancies else 'DISCREPANCIES_FOUND',
            'discrepancies': discrepancies
        }), 200
    except Exception as e:
        return jsonify({'message': 'Error in reconciliation', 'error': str(e)}), 500
