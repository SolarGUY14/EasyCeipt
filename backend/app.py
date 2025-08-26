from flask import Flask, jsonify, render_template
from flask_cors import CORS
from dotenv import load_dotenv
import os

# Import route blueprints (now cleaner with __init__.py)
from routes import receipts_bp, purchases_bp

# Load environment variables
load_dotenv()

# Create Flask app
easyceipt = Flask(__name__)
# Enable CORS with credentials support
CORS(easyceipt, supports_credentials=True)

# Register blueprints
easyceipt.register_blueprint(receipts_bp)
easyceipt.register_blueprint(purchases_bp)

# Health check route (stays in main app.py)
@easyceipt.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "message": "Backend is running!"})

@easyceipt.route('/', methods=['GET'])
def homepage():
    return render_template('home.html')

@easyceipt.route('/login', methods=['GET'])
def login():
    return render_template('login.html')
@easyceipt.route('/register', methods=['GET'])
def register():
    return render_template('register.html')

if __name__ == '__main__':
    easyceipt.run(debug=True, port=8000) 