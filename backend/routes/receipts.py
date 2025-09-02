from flask import Blueprint, request, jsonify
from flask_cors import CORS
from utils.supabase_client import get_supabase_client
import jwt

# Create a Blueprint for receipt routes
receipts_bp = Blueprint('receipts', __name__)

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

@receipts_bp.route('/api/receipts/generate-pdf', methods=['POST'])
def generate_pdf_receipt():
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
        
        # TODO: Generate PDF receipt using reportlab or weasyprint
        # TODO: Return PDF file or save to cloud storage
        
        return jsonify({
            "message": "PDF generation will be implemented here",
            "purchases": response.data,
            "total_amount": sum(p['tot_amount'] for p in response.data)
        })
        
    except Exception as e:
        return jsonify({"error": f"Failed to generate PDF: {str(e)}"}), 500

@receipts_bp.route('/api/receipts/email', methods=['POST'])
def email_receipt():
    """Email receipt to specified address"""
    user, error = verify_jwt_token()
    if error:
        return jsonify({"error": error}), 401
    
    try:
        data = request.get_json()
        purchase_ids = data.get('purchase_ids', [])
        email_to = data.get('email_to')
        
        if not purchase_ids or not email_to:
            return jsonify({"error": "Purchase IDs and email address are required"}), 400
        
        # Get purchases from database
        db = get_supabase_client()
        response = db.table('Purchases').select('*').in_('id', purchase_ids).eq('email', user.email).execute()
        
        if not response.data:
            return jsonify({"error": "No purchases found"}), 404
        
        # TODO: Generate PDF and email using SendGrid or similar
        
        return jsonify({
            "message": "Email functionality will be implemented here",
            "email_to": email_to,
            "purchases_count": len(response.data)
        })
        
    except Exception as e:
        return jsonify({"error": f"Failed to email receipt: {str(e)}"}), 500 