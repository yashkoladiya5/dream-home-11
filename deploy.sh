#!/bin/bash
set -euo pipefail

echo "=== Dream Home 11 Deployment ==="

# Check prerequisites
command -v node >/dev/null 2>&1 || { echo "Node.js is required"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "npm is required"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "Docker is required"; exit 1; }

# Build and start infrastructure
echo "Starting infrastructure (PostgreSQL + Redis)..."
cd backend
docker compose up -d db redis

# Wait for services
echo "Waiting for services..."
sleep 5

# Install dependencies and build
echo "Installing backend dependencies..."
npm ci
echo "Building backend..."
npm run build

# Start application
echo "Starting application..."
npm run start:prod &

echo "=== Deployment complete ==="
echo "Backend: http://localhost:3000"
