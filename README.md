# CineBook Lite

Cinema ticket booking and management system (PERN stack).

```
cinebook-lite/
├── backend/    Express + Prisma + PostgreSQL API  (http://localhost:5000)
└── frontend/   React + Vite + Tailwind app        (http://localhost:5173)
```

## Run it

Backend:
```
cd backend
npm install
cp .env.example .env        # then edit DATABASE_URL
npx prisma generate
npm run dev
```

Frontend (second terminal):
```
cd frontend
npm install
cp .env.example .env
npm run dev
```

Health check: http://localhost:5000/api/health
