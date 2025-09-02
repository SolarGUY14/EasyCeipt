from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os

# Import route blueprints (only useful ones)
from routes import receipts_bp

# Load environment variables
load_dotenv()

# Create Flask app
easyceipt = Flask(__name__)
# Enable CORS with credentials support
CORS(easyceipt, supports_credentials=True)

# Register blueprints
easyceipt.register_blueprint(receipts_bp)

# Health check route
@easyceipt.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "message": "Backend is running!"})

if __name__ == '__main__':
    easyceipt.run(debug=True, port=8000) 