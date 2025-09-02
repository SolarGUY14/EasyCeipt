from flask import Blueprint, request, jsonify, send_file
from flask_cors import CORS
from utils.supabase_client import get_supabase_client
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from datetime import datetime
import io
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
        print(f"JWT Token verified for user: {user.user.email if user.user else 'None'}")
        return user.user, None
    except Exception as e:
        print(f"JWT verification failed: {str(e)}")
        return None, f"Invalid token: {str(e)}"

@receipts_bp.route('/api/receipts/debug', methods=['GET'])
def debug_purchases():
    """Debug endpoint to check what purchases exist"""
    user, error = verify_jwt_token()
    if error:
        return jsonify({"error": error}), 401
    
    try:
        # Get the auth token from the request
        auth_header = request.headers.get('Authorization')
        token = auth_header.split(' ')[1] if auth_header else None
        
        db = get_supabase_client()
        
        # Set the auth token for this session
        if token:
            db.auth.set_session(access_token=token, refresh_token="")
        
        # Get all purchases for this user
        print(f"Querying purchases for exact email: '{user.email}'")
        user_purchases = db.table('Purchases').select('*').eq('email', user.email).execute()
        print(f"User purchases result: {user_purchases}")
        
        # Get all purchases in the database (first 10) 
        all_purchases = db.table('Purchases').select('id, email, vendor').limit(10).execute()
        print(f"All purchases result: {all_purchases}")
        
        # Get ALL purchases without any filter to see what's really there
        all_unfiltered = db.table('Purchases').select('*').execute()
        print(f"All unfiltered purchases: {all_unfiltered}")
        
        return jsonify({
            "current_user_email": user.email,
            "user_purchases_count": len(user_purchases.data) if user_purchases.data else 0,
            "user_purchases": user_purchases.data[:5] if user_purchases.data else [],  # First 5 only
            "all_purchases_sample": all_purchases.data if all_purchases.data else [],
            "total_purchases_in_db": len(all_unfiltered.data) if all_unfiltered.data else 0,
            "all_unfiltered_sample": all_unfiltered.data[:5] if all_unfiltered.data else [],
            "auth_token_present": bool(token),
            "supabase_url": db.supabase_url
        })
        
    except Exception as e:
        print(f"Debug error: {str(e)}")
        return jsonify({"error": f"Debug failed: {str(e)}"}), 500

@receipts_bp.route('/api/receipts/generate-pdf', methods=['POST'])
def generate_pdf_receipt():
    """Generate PDF receipt for selected purchases"""
    user, error = verify_jwt_token()
    if error:
        return jsonify({"error": error}), 401
    
    try:
        data = request.get_json()
        purchase_ids = data.get('purchase_ids', [])
        
        print(f"Received PDF generation request for user: {user.email}")
        print(f"Purchase IDs requested: {purchase_ids}")
        
        if not purchase_ids:
            return jsonify({"error": "No purchase IDs provided"}), 400
        
        # Get the auth token from the request and set session
        auth_header = request.headers.get('Authorization')
        token = auth_header.split(' ')[1] if auth_header else None
        
        # Get purchases from database
        db = get_supabase_client()
        
        # Set the auth token for this session
        if token:
            db.auth.set_session(access_token=token, refresh_token="")
        
        print(f"Querying purchases for user {user.email} with IDs: {purchase_ids}")
        
        response = db.table('Purchases').select('*').in_('id', purchase_ids).eq('email', user.email).order('trans_date', desc=True).execute()
        
        print(f"Query result: {len(response.data) if response.data else 0} purchases found")
        print(f"Response data: {response.data}")
        
        if not response.data:
            return jsonify({"error": "No purchases found"}), 404
        
        # Get user profile for receipt header
        user_response = db.table('Users').select('team_name, team_number').eq('email', user.email).single().execute()
        user_profile = user_response.data if user_response.data else {}
        
        # Generate PDF
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=18)
        
        # Container for the 'Flowable' objects
        elements = []
        
        # Get styles
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=18,
            spaceAfter=30,
            alignment=1,  # Center alignment
        )
        
        # Title
        team_name = user_profile.get('team_name', 'Team')
        team_number = user_profile.get('team_number', 'N/A')
        team_email = user_profile.get('email', 'N/A')
        coach_name = user_profile.get('coach_name', 'N/A')
        title = Paragraph(f"<b>Expense Receipt - {team_name} (Team {team_number})</b>\n <b>Coach:</b> {coach_name}\n <b>Email:</b> {team_email}", title_style)
        elements.append(title)
        
        # Date
        date_text = Paragraph(f"<b>Generated:</b> {datetime.now().strftime('%B %d, %Y at %I:%M %p')}", styles['Normal'])
        elements.append(date_text)
        elements.append(Spacer(1, 12))
        
        # Create table data
        table_data = [
            ['Date', 'Vendor', 'Amount', 'Tax', 'Total']
        ]
        
        total_amount = 0
        total_tax = 0
        
        for purchase in response.data:
            purchase_date = datetime.strptime(purchase['trans_date'], '%Y-%m-%d').strftime('%m/%d/%Y')
            vendor = purchase['vendor']
            amount = purchase['tot_amount']
            tax_amount = purchase.get('tax_amount', 0) or 0
            real_amount = purchase.get('real_amount', amount) or (amount + tax_amount)
            
            table_data.append([
                purchase_date,
                vendor,
                f"${amount:.2f}",
                f"${tax_amount:.2f}" if tax_amount > 0 else "-",
                f"${real_amount:.2f}"
            ])
            
            total_amount += amount
            total_tax += tax_amount
        
        # Add totals row
        table_data.append(['', '', '', '', ''])  # Empty row for spacing
        table_data.append(['', '', f"${total_amount:.2f}", f"${total_tax:.2f}", f"${total_amount + total_tax:.2f}"])
        table_data.append(['', '', 'Subtotal', 'Total Tax', 'Grand Total'])
        
        # Create table
        table = Table(table_data, colWidths=[1.2*inch, 2*inch, 1*inch, 1*inch, 1*inch])
        
        # Style the table
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -3), colors.beige),
            ('BACKGROUND', (0, -2), (-1, -1), colors.lightgrey),
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
            ('GRID', (0, 0), (-1, -3), 1, colors.black),
            ('GRID', (0, -2), (-1, -1), 1, colors.black),
            ('ALIGN', (2, 0), (-1, -1), 'RIGHT'),
        ]))
        
        elements.append(table)
        elements.append(Spacer(1, 20))
        
        # Footer
        footer_text = Paragraph("This receipt was generated electronically by EasyCeipt.", styles['Normal'])
        elements.append(footer_text)
        
        # Build PDF
        doc.build(elements)
        
        # Get the value of the BytesIO buffer and write it to the response
        pdf_data = buffer.getvalue()
        buffer.close()
        
        # Create a BytesIO object for the response
        output = io.BytesIO(pdf_data)
        output.seek(0)
        
        return send_file(
            output,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=f'receipt-{datetime.now().strftime("%Y%m%d")}.pdf'
        )
        
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