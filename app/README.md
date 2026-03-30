# MyTravel — App

## Quick Start

### 1. Prerequisites
- Python 3.12+ with `uv` installed (`pip install uv`)
- Node.js 22 LTS with `pnpm` (`npm install -g pnpm`)
- Docker Desktop (for local PostgreSQL)

### 2. Environment files
```bash
cp api/.env.example api/.env          # Fill in your API keys
cp web/.env.local.example web/.env.local  # Fill in your tokens
```

### 3. Start local database
```bash
docker compose up -d
```

### 4. Install dependencies
```bash
# Backend
cd api && uv sync && cd ..

# Frontend
pnpm install
```

### 5. Run database migrations
```bash
cd api && uv run alembic upgrade head && cd ..
```

### 6. Start dev servers (3 separate terminals)
```bash
# Terminal 1 — FastAPI (http://localhost:8000)
cd api && uv run uvicorn main:app --reload

# Terminal 2 — Next.js (http://localhost:3000)
cd web && pnpm dev
```

### API docs
Once the backend is running: http://localhost:8000/docs

## Structure
```
app/
├── api/          FastAPI backend (Python 3.12)
├── web/          Next.js 15 frontend
└── docker-compose.yml   Local PostgreSQL
```

## Full implementation guide
See `../Docs/MyTravel-MVP1-Implementation-Steps.md` for the complete step-by-step build guide.
