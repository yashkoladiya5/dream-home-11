# Dream Home 11 - Admin Panel

React/Vite admin panel for managing the Dream Home 11 platform.

## Prerequisites

- Node.js 20+
- npm

## Quick Start

```bash
cd admin
npm install
npm run dev
```

The admin panel starts at `http://localhost:5173` and proxies `/api` requests to `http://localhost:3000`.

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

## Build for Production

```bash
npm run build
```

Output is in `dist/`.

## Docker Deployment

```bash
# Build and run
docker build -t dream11-admin .
docker run -p 8080:8080 dream11-admin
```

Or use the compose file from `deploy/`:

```bash
cd ../deploy
docker compose -f docker-compose.prod.yml up admin
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | API base path | `/api/v1` |
| `VITE_APP_NAME` | Application display name | `Dream Home 11 Admin` |

Create a `.env` file from `.env.example` for local overrides.

## Project Structure

```
admin/
├── public/          # Static assets
├── src/
│   ├── components/  # Reusable UI components
│   ├── lib/         # API client and utilities
│   ├── pages/       # Route pages
│   └── main.tsx     # Entry point
├── Dockerfile       # Multi-stage Docker build
├── nginx.conf       # Nginx config for container
└── vite.config.ts   # Vite configuration
```

## API Endpoints

The admin panel communicates with the NestJS backend via:

- `GET /api/v1/...` - REST API endpoints
- Proxied through nginx to `http://backend:3000` in production
