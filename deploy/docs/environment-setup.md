# Environment Setup Guide — Dream Home 11

This guide walks through setting up a local development environment for Dream Home 11.

---

## Prerequisites

| Tool | Version | Install Guide |
|------|---------|--------------|
| Flutter SDK | 3.10+ | [flutter.dev](https://flutter.dev/docs/get-started/install) |
| Node.js | 20 LTS | [nodejs.org](https://nodejs.org/) |
| Docker | 24+ | [docker.com](https://docs.docker.com/get-docker/) |
| Docker Compose | 2.20+ | Included with Docker Desktop |
| PostgreSQL | 16 (or use Docker) | — |
| Redis | 7 (or use Docker) | — |
| Git | 2.x | [git-scm.com](https://git-scm.com/) |
| Firebase Project | — | [console.firebase.google.com](https://console.firebase.google.com/) |
| Razorpay Account | — | [razorpay.com](https://razorpay.com/) |
| Sentry Account | Optional | [sentry.io](https://sentry.io/) |

---

## Step 1: Clone & Install Dependencies

```bash
# Clone the repository
git clone https://github.com/your-org/dream-home-11.git
cd dream-home-11

# Install Flutter dependencies
flutter pub get

# Install backend dependencies
cd backend
npm install
cd ..
```

### If you encounter issues:

```bash
# Flutter — ensure Dart SDK is set
dart --version

# Backend — clear npm cache if needed
cd backend && rm -rf node_modules package-lock.json && npm install
```

---

## Step 2: Environment Variables

### Backend Configuration

```bash
cd backend

# Copy the example env file
cp .env.example .env
```

Edit `.env` with your local values:

```bash
# App configuration
PORT=3000
NODE_ENV=development

# Database configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=dream_home_11
DB_POOL_SIZE=20

# Redis configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT Configuration
JWT_SECRET=your-local-dev-secret-at-least-32-chars-long
JWT_EXPIRATION=7d

# Firebase Configuration
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
ENABLE_MOCK_AUTH=true

# Optional: Payments (Razorpay)
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

# Optional: Sentry
SENTRY_DSN=
SENTRY_TRACES_SAMPLE_RATE=0.2

# Optional: Health check security
HEALTH_SECRET=
```

### Flutter Configuration

Flutter uses `--dart-define` flags for build-time variables. Create a run configuration or pass them directly:

```bash
flutter run \
  --dart-define=API_BASE_URL=http://localhost:3000 \
  --dart-define=SENTRY_DSN= \
  --dart-define=ENABLE_SSL_PINNING=false
```

For VS Code, add to `.vscode/launch.json`:

```json
{
  "configurations": [
    {
      "name": "Dream Home 11 (Dev)",
      "request": "launch",
      "type": "dart",
      "args": [
        "--dart-define=API_BASE_URL=http://localhost:3000",
        "--dart-define=SENTRY_DSN=",
        "--dart-define=ENABLE_SSL_PINNING=false"
      ]
    }
  ]
}
```

---

## Step 3: Database Setup

### Option A: Using Docker (Recommended)

```bash
# Start PostgreSQL and Redis containers
docker-compose up -d db redis

# Verify they're running
docker-compose ps

# You should see:
#   db     | docker-entrypoint.sh postgres   | Up (healthy)  5432/tcp
#   redis  | docker-entrypoint.sh sh ...     | Up (healthy)  6379/tcp
```

### Option B: Using the Production Compose File

```bash
docker-compose -f deploy/docker-compose.prod.yml up -d db redis pgbouncer
```

### Run Database Migrations

```bash
cd backend

# Build the project first (needed for migration path)
npm run build

# Run migrations
npx typeorm migration:run -d dist/config/typeorm.config.js

# Or using the script
npm run migration:run
```

### Seed Data (Optional)

```bash
# If a seed script exists
npm run seed
```

---

## Step 4: Run the Application

### Start the Backend

```bash
cd backend

# Development mode with hot reload
npm run start:dev

# Production mode
npm run build && npm run start:prod

# Debug mode
npm run start:debug
```

The server starts on `http://localhost:3000`.

### Start the Flutter App

```bash
# From the project root

# Check available devices
flutter devices

# Run on a specific device
flutter run -d <device-id>

# Run on Chrome (web debugging)
flutter run -d chrome

# Run with all dart-defines
flutter run \
  --dart-define=API_BASE_URL=http://localhost:3000 \
  --dart-define=SENTRY_DSN= \
  --dart-define=ENABLE_SSL_PINNING=false
```

---

## Step 5: Verify Everything Works

### Health Check

```bash
# Simple health check
curl http://localhost:3000/health

# Expected response:
# {"status":"ok","timestamp":"2026-07-03T12:00:00.000Z","uptime":42}

# Readiness check (verifies DB and Redis)
curl http://localhost:3000/health/ready

# Expected:
# {"status":"ok","timestamp":"...","duration_ms":5,"checks":[...]}

# Liveness check
curl http://localhost:3000/health/live
```

### Swagger API Docs

Open your browser to: [http://localhost:3000/api/docs](http://localhost:3000/api/docs)

You should see the Swagger UI with all API endpoints documented. Bearer auth can be tested directly from the UI by clicking "Authorize" and entering a JWT token.

### Mock Login (Development Only)

```bash
# Get a mock JWT token for testing
curl -X POST http://localhost:3000/api/v1/auth/mock-login \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "9999999999"}'

# Response includes a JWT token you can use for other endpoints
```

### Test Authenticated Endpoint

```bash
# Replace TOKEN with the JWT from mock login
curl http://localhost:3000/api/v1/users/me \
  -H "Authorization: Bearer TOKEN"

# Expected: User object
```

---

## Firebase Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" and follow the wizard
3. Once created, go to **Authentication → Sign-in method**
4. Enable **Phone** sign-in provider
5. Add your test phone numbers (for development)

### 2. Download Service Account Key

1. Go to **Project Settings → Service accounts**
2. Click "Generate new private key"
3. Save the JSON file as `backend/firebase-service-account.json`
4. This file is used by the backend to verify Firebase ID tokens

### 3. Configure Android

1. Go to **Project Settings → General → Your apps**
2. Click **Add app → Android**
3. Package name: `com.dreamhome11.app` (or your app's package name)
4. Download `google-services.json`
5. Place it at: `android/app/google-services.json`
6. The `build.gradle` already includes the Google Services plugin

### 4. Configure iOS

1. Click **Add app → iOS**
2. Bundle ID: `com.dreamhome11.app`
3. Download `GoogleService-Info.plist`
4. Place it at: `ios/Runner/GoogleService-Info.plist`

### 5. Enable Mock Auth for Local Development

Set `ENABLE_MOCK_AUTH=true` in your backend `.env` to bypass Firebase token verification during development:

```bash
# .env
ENABLE_MOCK_AUTH=true
```

With mock auth enabled, use the `/api/v1/auth/mock-login` endpoint with any phone number to get a JWT token without going through Firebase.

---

## Sentry Setup (Optional)

### Backend

1. Create a project in [sentry.io](https://sentry.io/)
2. Select **Node.js** as the platform
3. Copy the DSN

```bash
# .env
SENTRY_DSN=https://your-dsn@sentry.io/project-id
SENTRY_TRACES_SAMPLE_RATE=0.2
```

### Flutter

```bash
# Run with Sentry enabled
flutter run --dart-define=SENTRY_DSN=https://your-dsn@sentry.io/project-id
```

For release builds:

```bash
flutter build apk --dart-define=SENTRY_DSN=https://your-dsn@sentry.io/project-id
flutter build ios --dart-define=SENTRY_DSN=https://your-dsn@sentry.io/project-id
```

---

## Docker Compose (Full Local Stack)

The `docker-compose.yml` (in `backend/`) provides a complete local environment:

```bash
# Start everything
docker-compose up -d

# Services: db (postgres), redis, app (backend)

# View logs
docker-compose logs -f

# Stop everything
docker-compose down
```

The production compose file at `deploy/docker-compose.prod.yml` includes additional services:

```bash
docker-compose -f deploy/docker-compose.prod.yml up -d

# Services: db, redis, pgbouncer, app (x3 replicas), nginx, certbot, fluentd
```

---

## Common Issues & Solutions

### Port already in use

```bash
# Check what's using port 3000
lsof -i :3000
# Kill the process
kill -9 <PID>
```

### Database connection refused

```bash
# Check if PostgreSQL is running
docker-compose ps db

# Check logs
docker-compose logs db

# Verify connection
psql -h localhost -U postgres -d dream_home_11
```

### Redis connection refused

```bash
# Check if Redis is running
docker-compose ps redis

# Test connection
redis-cli ping
# Should respond: PONG
```

### Migration fails

```bash
# Rebuild if TypeORM config path is wrong
cd backend
npm run build
npx typeorm migration:run -d dist/config/typeorm.config.js
```

### Flutter build errors

```bash
# Clean and rebuild
flutter clean
flutter pub get
flutter run
```

---

## Quick Start (TL;DR)

```bash
# 1. Prerequisites check
node --version  # Should be 20+
flutter --version  # Should be 3.10+
docker --version  # Should be 24+

# 2. Install dependencies
flutter pub get
cd backend && npm install && cd ..

# 3. Configure environment
cd backend && cp .env.example .env
# Edit .env with your values
cd ..

# 4. Start database
docker-compose up -d db redis

# 5. Run migrations
cd backend && npm run build && npx typeorm migration:run -d dist/config/typeorm.config.js && cd ..

# 6. Start backend
cd backend && npm run start:dev &
cd ..

# 7. Verify
sleep 3 && curl http://localhost:3000/health

# 8. Run Flutter
flutter run
```
