#!/bin/bash

echo "Starting Flask Backend..."
echo "The backend will be available at http://localhost:5000"

# Navigate to backend directory
cd backend

# Create and activate virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Start the Flask server
python app.py 