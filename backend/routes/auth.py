from flask import Blueprint, request, jsonify, session
from flask_cors import CORS
from utils.supabase_client import get_supabase_client
from werkzeug.security import generate_password_hash, check_password_hash
import re

# Create a Blueprint for auth routes
auth_bp = Blueprint('auth', __name__)

def validate_email(email):
    """Basic email validation"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password(password):
    """Basic password validation"""
    return len(password) >= 8

@auth_bp.route('/api/auth/login', methods=['POST'])
def login():
    """User login endpoint"""
    try:
        db = get_supabase_client()
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({"error": "Email and password are required"}), 400
        
        # Validate email format
        if not validate_email(email):
            return jsonify({"error": "Invalid email format"}), 400
        
        try:
            response = db.table('Users').select('*').eq('email', email).single().execute()
            user = response.data
        except Exception as e:
            # Handle case where user doesn't exist or database error
            return jsonify({"error": "Invalid email or password"}), 401
        
        if not user:
            return jsonify({"error": "Invalid email or password"}), 401
        
        if not check_password_hash(user['password'], password):
            return jsonify({"error": "Invalid email or password"}), 401
        
        # Set session
        session['email'] = user['email']
        return jsonify({
            "message": "Login successful", 
            "user": {
                "email": user['email'], 
                "team_name": user['team_name']
            }
        })
    except Exception as e:
        return jsonify({"error": "Internal server error"}), 500

@auth_bp.route('/api/auth/register', methods=['POST'])
def register():
    """User registration endpoint"""
    try:
        db = get_supabase_client()
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        team_name = data.get('team_name')
        team_number = data.get('team_number')
        coach_name = data.get('coach_name')
        
        # Validate required fields
        if not email or not password:
            return jsonify({"error": "Email and password are required"}), 400
        
        if not team_name or not team_number or not coach_name:
            return jsonify({"error": "Team name, team number, and coach name are required"}), 400
        
        # Validate email format
        if not validate_email(email):
            return jsonify({"error": "Invalid email format"}), 400
        
        # Validate password strength
        if not validate_password(password):
            return jsonify({"error": "Password must be at least 8 characters long"}), 400
        
        # Check if email already exists
        try:
            existing_user = db.table('Users').select('email').eq('email', email).single().execute()
            if existing_user.data:
                return jsonify({"error": "Email already registered"}), 409
        except Exception:
            # User doesn't exist, which is what we want
            pass
        
        hashed_password = generate_password_hash(password)
        
        # Insert new user
        db.table('Users').insert({
            'email': email, 
            'password': hashed_password, 
            'team_name': team_name, 
            'team_number': team_number,
            'coach_name': coach_name
        }).execute()
        
        return jsonify({"message": "Registration successful"})
    except Exception as e:
        return jsonify({"error": "Internal server error"}), 500

@auth_bp.route('/api/auth/logout', methods=['POST'])
def logout():
    session.clear()
    resp = jsonify({"message": "Logout successful"})
    # Explicitly clear the session cookie
    resp.set_cookie(
        key='session',
        value='',
        expires=0,
        path='/',
        samesite='None',
        secure=True  # Set to True for production
    )
    return resp

@auth_bp.route('/api/auth/status', methods=['GET'])
def auth_status():
    if 'email' in session:
        return jsonify({"authenticated": True, "email": session['email']})
    return jsonify({"authenticated": False}), 401 