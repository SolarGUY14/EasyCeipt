#!/bin/bash

echo "Starting Next.js Frontend..."
echo "The frontend will be available at http://localhost:3000"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Start the frontend development server
npm run dev 