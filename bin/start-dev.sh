#!/bin/bash

echo "Starting EasyCeipt Development Environment..."
echo "Frontend will be available at http://localhost:3000"
echo "Backend will be available at http://localhost:8000"

# Start backend in the background
./bin/start-backend.sh &

# Start frontend
./bin/start-frontend.sh 