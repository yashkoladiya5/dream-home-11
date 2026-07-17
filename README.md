# Dream Home 11

A fantasy home design contest platform built with NestJS, Flutter, and React.

<!-- Dream Home 11 Repository Information and Setup Guide -->

## Projects

- **backend/** — NestJS API server (PostgreSQL + Redis)
- **admin/** — React admin panel (Vite + TypeScript + Tailwind)
- **lib/** — Flutter mobile app

## Requirements

- Node.js 20+
- Flutter 3.38+
- PostgreSQL 16+
- Redis 7+

## Quick Start

```bash
# Start services
docker compose up -d

# Backend
cd backend && npm install && npm run start:dev

# Admin
cd admin && npm install && npm run dev

# Flutter
flutter pub get && flutter run
```
