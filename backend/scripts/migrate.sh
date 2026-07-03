#!/bin/bash
set -eo pipefail

echo "=== Running Database Migrations ==="

NODE_ENV=${NODE_ENV:-production}

if [ -z "$DB_HOST" ] || [ -z "$DB_PASSWORD" ]; then
  echo "Loading environment variables..."
  if [ -f .env.production ]; then
    export $(grep -v '^\s*#' .env.production | grep -v '^\s*$' | xargs)
  elif [ -f .env ]; then
    export $(grep -v '^\s*#' .env | grep -v '^\s*$' | xargs)
  else
    echo "Error: No .env file found"
    exit 1
  fi
fi

echo "Waiting for database connection..."
for i in $(seq 1 30); do
  if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USERNAME" -d "$DB_DATABASE" -c "SELECT 1" > /dev/null 2>&1; then
    echo "Database connected"
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "Error: Could not connect to database after 30 attempts"
    exit 1
  fi
  sleep 2
done

echo "Running TypeORM migrations..."
npx typeorm migration:run -d dist/typeorm.config.js

echo "Running seed scripts..."
npx ts-node scripts/seed.ts

echo "=== Migrations complete ==="
