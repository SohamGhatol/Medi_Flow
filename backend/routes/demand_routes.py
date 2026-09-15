from flask import Blueprint, request, jsonify
from models.medicine import Medicine, db
from models.sale import Sale
from models.order import Order, OrderItem
from routes.auth_routes import token_required
from datetime import datetime, timedelta
from sqlalchemy import func, text, Date, Float
import pandas as pd
import numpy as np

demand_bp = Blueprint('demand', __name__)

def get_demand_data(start_date, end_date, medicine_id=None):
    """
    Returns a unified query of valid demand transactions:
    POS Sales + Valid Online Orders
    """
    # Sales query
    sales_q = db.session.query(
        Sale.medicine_id.label('medicine_id'),
        Sale.quantity.label('quantity'),
        Sale.date.label('txn_date')
    ).filter(Sale.date.between(start_date, end_date))
    
    if medicine_id:
        sales_q = sales_q.filter(Sale.medicine_id == medicine_id)

    # Orders query
    valid_statuses = ['Approved', 'Processing', 'Out for Delivery', 'Delivered']
    orders_q = db.session.query(
        OrderItem.medicine_id.label('medicine_id'),
        OrderItem.quantity.label('quantity'),
        Order.order_date.label('txn_date')
    ).join(Order, Order.order_id == OrderItem.order_id).filter(
        Order.order_date.between(start_date, end_date),
        Order.status.in_(valid_statuses)
    )
    
    if medicine_id:
        orders_q = orders_q.filter(OrderItem.medicine_id == medicine_id)
        
    # Combine
    transactions = sales_q.union_all(orders_q).subquery()
    return transactions

@demand_bp.route('/heatmap', methods=['GET'])
@token_required
def demand_heatmap(current_user):
    try:
        days_param = int(request.args.get('days', 30))
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days_param)
        
        granularity = request.args.get('granularity', 'day') # 'day' or 'hour'
        medicine_id = request.args.get('medicine_id')
        if medicine_id:
            medicine_id = int(medicine_id)

        txns = get_demand_data(start_date, end_date, medicine_id)
        
        results = []
        if granularity == 'day':
            # isodow: 1 = Monday, 7 = Sunday
            query = db.session.query(
                txns.c.medicine_id,
                Medicine.name.label('medicine_name'),
                func.extract('isodow', txns.c.txn_date).label('day_of_week'),
                func.sum(txns.c.quantity).label('total_qty')
            ).join(Medicine, Medicine.medicine_id == txns.c.medicine_id)\
             .group_by(txns.c.medicine_id, Medicine.name, func.extract('isodow', txns.c.txn_date))
            
            rows = query.all()
            
            # Group by medicine
            med_map = {}
            for r in rows:
                m_id = r.medicine_id
                if m_id not in med_map:
                    med_map[m_id] = {
                        'medicine_id': m_id,
                        'medicine_name': r.medicine_name,
                        '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0, '7': 0,
                        'total': 0
                    }
                day_str = str(int(r.day_of_week))
                qty = int(r.total_qty)
                med_map[m_id][day_str] = qty
                med_map[m_id]['total'] += qty
                
            results = list(med_map.values())
            # Sort by total descending
            results.sort(key=lambda x: x['total'], reverse=True)
            
        elif granularity == 'hour':
            query = db.session.query(
                txns.c.medicine_id,
                Medicine.name.label('medicine_name'),
                func.extract('hour', txns.c.txn_date).label('hour_of_day'),
                func.sum(txns.c.quantity).label('total_qty')
            ).join(Medicine, Medicine.medicine_id == txns.c.medicine_id)\
             .group_by(txns.c.medicine_id, Medicine.name, func.extract('hour', txns.c.txn_date))
            
            rows = query.all()
            
            med_map = {}
            for r in rows:
                m_id = r.medicine_id
                if m_id not in med_map:
                    med_map[m_id] = {
                        'medicine_id': m_id,
                        'medicine_name': r.medicine_name,
                        'total': 0
                    }
                    for h in range(24):
                        med_map[m_id][str(h)] = 0
                
                hour_str = str(int(r.hour_of_day))
                qty = int(r.total_qty)
                med_map[m_id][hour_str] = qty
                med_map[m_id]['total'] += qty
                
            results = list(med_map.values())
            results.sort(key=lambda x: x['total'], reverse=True)

        # Number of weeks calculation for normalization
        weeks = max(1, days_param / 7.0)
        
        return jsonify({
            'granularity': granularity,
            'days_period': days_param,
            'weeks': weeks,
            'data': results
        }), 200
        
    except Exception as e:
        return jsonify({'message': 'Error generating heatmap', 'error': str(e)}), 500

@demand_bp.route('/trend', methods=['GET'])
@token_required
def demand_trend(current_user):
    try:
        days_param = int(request.args.get('days', 30))
        medicine_id = request.args.get('medicine_id')
        if not medicine_id:
            return jsonify({'message': 'medicine_id is required for trend'}), 400
            
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days_param)
        
        txns = get_demand_data(start_date, end_date, medicine_id)
        
        # Group by day
        # In postgres, cast to Date
        query = db.session.query(
            func.cast(txns.c.txn_date, Date).label('day'),
            func.sum(txns.c.quantity).label('total_qty')
        ).group_by(func.cast(txns.c.txn_date, Date))\
         .order_by(func.cast(txns.c.txn_date, Date))
         
        rows = query.all()
        
        # Build complete date range to fill missing days with 0
        date_list = [start_date.date() + timedelta(days=x) for x in range((end_date.date() - start_date.date()).days + 1)]
        trend_dict = {d.isoformat(): 0 for d in date_list}
        
        for r in rows:
            d_str = r.day.isoformat() if hasattr(r.day, 'isoformat') else str(r.day)
            if d_str in trend_dict:
                trend_dict[d_str] = int(r.total_qty)
                
        # Calculate moving average and detect spikes
        trend_data = []
        values = list(trend_dict.values())
        
        for i, (date_str, val) in enumerate(trend_dict.items()):
            # 7-day trailing window
            start_idx = max(0, i - 6)
            window = values[start_idx:i+1]
            avg = sum(window) / len(window) if window else 0
            
            # Simple spike detection (e.g. > avg + 5 AND > 150% of avg)
            is_spike = False
            if len(window) >= 3 and val > (avg * 1.5) and val > (avg + 5):
                is_spike = True
                
            trend_data.append({
                'date': date_str,
                'actual': val,
                'moving_avg': round(avg, 2),
                'is_spike': is_spike
            })
            
        return jsonify({
            'medicine_id': medicine_id,
            'trend': trend_data
        }), 200
        
    except Exception as e:
        return jsonify({'message': 'Error generating trend', 'error': str(e)}), 500

@demand_bp.route('/ranking', methods=['GET'])
@token_required
def demand_ranking(current_user):
    try:
        days_param = int(request.args.get('days', 30))
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days_param)
        
        txns = get_demand_data(start_date, end_date)
        
        query = db.session.query(
            txns.c.medicine_id,
            Medicine.name.label('medicine_name'),
            Medicine.quantity.label('current_stock'),
            func.sum(txns.c.quantity).label('total_qty')
        ).join(Medicine, Medicine.medicine_id == txns.c.medicine_id)\
         .group_by(txns.c.medicine_id, Medicine.name, Medicine.quantity)\
         .order_by(func.sum(txns.c.quantity).desc())\
         .limit(10)
         
        rows = query.all()
        
        results = []
        for r in rows:
            daily_avg = int(r.total_qty) / max(1, days_param)
            days_of_stock = int(r.current_stock) / daily_avg if daily_avg > 0 else 999
            
            results.append({
                'medicine_id': r.medicine_id,
                'medicine_name': r.medicine_name,
                'total_sold': int(r.total_qty),
                'daily_avg': round(daily_avg, 2),
                'current_stock': int(r.current_stock),
                'est_days_stock': round(days_of_stock, 1)
            })
            
        return jsonify(results), 200
        
    except Exception as e:
        return jsonify({'message': 'Error generating ranking', 'error': str(e)}), 500
