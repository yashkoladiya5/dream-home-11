#!/bin/bash
set -eo pipefail

echo "=== Dream Home 11 Production Deployment ==="

if [ ! -f ".env.production" ]; then
  echo "Error: .env.production file not found"
  echo "Copy .env.example to .env.production and fill in production values"
  exit 1
fi

echo "--- Pulling latest images ---"
docker-compose -f docker-compose.prod.yml pull

echo "--- Building images ---"
docker-compose -f docker-compose.prod.yml build --pull

echo "--- Running database migrations ---"
docker-compose -f docker-compose.prod.yml run --rm app npx typeorm migration:run -d dist/typeorm.config.js

echo "--- Starting production stack ---"
docker-compose -f docker-compose.prod.yml up -d

echo "--- Checking health ---"
sleep 10
docker-compose -f docker-compose.prod.yml ps

echo "=== Deployment complete ==="
echo "App: https://dreamhome11.com"
echo "Health: https://dreamhome11.com/health"
