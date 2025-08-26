from flask import Blueprint, request, jsonify
from flask_cors import CORS
from utils.supabase_client import get_supabase_client
from datetime import datetime
import jwt
import os

purchases_bp = Blueprint('purchases', __name__)

def verify_jwt_token():
    """Verify JWT token from Authorization header"""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return None, "No valid authorization header"
    
    token = auth_header.split(' ')[1]
    
    try:
        # Verify token with Supabase
        db = get_supabase_client()
        user = db.auth.get_user(token)
        return user.user, None
    except Exception as e:
        return None, f"Invalid token: {str(e)}"

@purchases_bp.route('/api/purchases', methods=['GET'])
def get_purchases():
    """Get all purchases for the authenticated user"""
    user, error = verify_jwt_token()
    if error:
        return jsonify({"error": error}), 401
    
    try:
        db = get_supabase_client()
        response = db.table('Purchases').select('*').eq('email', user.email).order('trans_date', desc=True).execute()
        return jsonify({"purchases": response.data})
    except Exception as e:
        return jsonify({"error": "Failed to fetch purchases"}), 500

@purchases_bp.route('/api/purchases', methods=['POST'])
def create_purchase():
    """Create a new purchase"""
    user, error = verify_jwt_token()
    if error:
        return jsonify({"error": error}), 401
    
    try:
        data = request.get_json()
        date = data.get('date')
        vendor_name = data.get('vendor_name')
        amount = data.get('amount')
        paid_tax = data.get('paid_tax', False)
        description = data.get('description', '')
        
        # Validate required fields
        if not date or not vendor_name or amount is None:
            return jsonify({"error": "Date, vendor name, and amount are required"}), 400
        
        # Validate amount
        try:
            amount = float(amount)
            if amount < 0:
                return jsonify({"error": "Amount must be positive"}), 400
        except ValueError:
            return jsonify({"error": "Invalid amount"}), 400
        
        # Validate date format
        try:
            datetime.strptime(date, '%Y-%m-%d')
        except ValueError:
            return jsonify({"error": "Invalid date format. Use YYYY-MM-DD"}), 400
        
        db = get_supabase_client()
        
        # Insert purchase into database
        purchase_data = {
            'email': user.email,
            'trans_date': date,
            'vendor': vendor_name,
            'tot_amount': amount,
            'tax': paid_tax,
            'describe': description
        }
        
        response = db.table('Purchases').insert(purchase_data).execute()
        
        if response.data:
            return jsonify({"purchase": response.data[0]})
        else:
            return jsonify({"error": "Failed to create purchase"}), 500
            
    except Exception as e:
        return jsonify({"error": f"Failed to create purchase: {str(e)}"}), 500

@purchases_bp.route('/api/purchases/<int:purchase_id>', methods=['PUT'])
def update_purchase(purchase_id):
    """Update a purchase"""
    user, error = verify_jwt_token()
    if error:
        return jsonify({"error": error}), 401
    
    try:
        data = request.get_json()
        
        # Verify user owns this purchase
        db = get_supabase_client()
        existing = db.table('Purchases').select('*').eq('id', purchase_id).eq('email', user.email).single().execute()
        
        if not existing.data:
            return jsonify({"error": "Purchase not found or access denied"}), 404
        
        # Update purchase
        response = db.table('Purchases').update(data).eq('id', purchase_id).eq('email', user.email).execute()
        
        if response.data:
            return jsonify({"purchase": response.data[0]})
        else:
            return jsonify({"error": "Failed to update purchase"}), 500
            
    except Exception as e:
        return jsonify({"error": f"Failed to update purchase: {str(e)}"}), 500

@purchases_bp.route('/api/purchases/<int:purchase_id>', methods=['DELETE'])
def delete_purchase(purchase_id):
    """Delete a purchase"""
    user, error = verify_jwt_token()
    if error:
        return jsonify({"error": error}), 401
    
    try:
        db = get_supabase_client()
        
        # Verify user owns this purchase and delete it
        response = db.table('Purchases').delete().eq('id', purchase_id).eq('email', user.email).execute()
        
        if response.data:
            return jsonify({"message": "Purchase deleted successfully"})
        else:
            return jsonify({"error": "Purchase not found or access denied"}), 404
            
    except Exception as e:
        return jsonify({"error": f"Failed to delete purchase: {str(e)}"}), 500

@purchases_bp.route('/api/purchases/generate-receipt', methods=['POST'])
def generate_receipt():
    """Generate PDF receipt for selected purchases"""
    user, error = verify_jwt_token()
    if error:
        return jsonify({"error": error}), 401
    
    try:
        data = request.get_json()
        purchase_ids = data.get('purchase_ids', [])
        
        if not purchase_ids:
            return jsonify({"error": "No purchase IDs provided"}), 400
        
        # Get purchases from database
        db = get_supabase_client()
        response = db.table('Purchases').select('*').in_('id', purchase_ids).eq('email', user.email).execute()
        
        if not response.data:
            return jsonify({"error": "No purchases found"}), 404
        
        # TODO: Generate PDF receipt
        # This is where you'd add PDF generation logic
        # For now, just return the purchases data
        
        return jsonify({
            "message": "Receipt generation endpoint",
            "purchases": response.data
        })
        
    except Exception as e:
        return jsonify({"error": f"Failed to generate receipt: {str(e)}"}), 500