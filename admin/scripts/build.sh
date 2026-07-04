#!/bin/bash
set -e

echo "Building Dream Home 11 Admin Panel..."

echo "Installing dependencies..."
npm ci

echo "Running lint..."
npm run lint || true

echo "Building production bundle..."
npm run build

echo "Build complete!"
echo "Output: admin/dist/"
du -sh dist/
