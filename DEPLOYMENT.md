# Deployment Guide - Vatici MVP

## Overview
- **Frontend**: Deployed on Vercel (Next.js)
- **Backend**: Deployed on Railway (Hono.js + Node.js)
- **Database**: Neon PostgreSQL (serverless)

## Backend Deployment (Railway)

### Prerequisites
1. Create Railway account at https://railway.app
2. Have your Neon connection strings ready (get from Neon console)
3. Generate a secure AUTH_SECRET (same as used in frontend NextAuth)

### Step-by-Step Railway Deployment

1. **Connect GitHub Repository**
   - Go to railway.app dashboard
   - Click "New Project" → "Deploy from GitHub"
   - Select the vatici repository
   - Authorize Railway to access your GitHub

2. **Create PostgreSQL Service (Optional - if using Railway DB)**
   - If you prefer to use Railway's PostgreSQL instead of Neon:
   - Add service → PostgreSQL
   - Railway will provide DATABASE_URL_UNPOOLED automatically
   - Skip to step 4

3. **Configure Environment Variables**
   - In Railway dashboard, select your deployed service
   - Go to Variables tab
   - Add the following environment variables:

   ```
   DATABASE_URL_UNPOOLED=postgresql://neondb_owner:npg_...@ep-...neon.tech/neondb?sslmode=require
   PORT=3001
   FRONTEND_URL=https://v0-vatici-three.vercel.app
   AUTH_SECRET=<same-as-nextauth-secret>
   NODE_ENV=production
   ```

   **Where to get these values:**
   - `DATABASE_URL_UNPOOLED`: From Neon console → Connection String (unpooled)
   - `FRONTEND_URL`: Your Vercel frontend URL (https://v0-vatici-three.vercel.app)
   - `AUTH_SECRET`: Same value as in your frontend's `.env` (from NextAuth setup)
   - `NODE_ENV`: Set to `production`

4. **Deploy**
   - Railway automatically detects `backend/railway.toml`
   - Builds with: `npm run build` (compiles TypeScript)
   - Starts with: `npm start` (runs compiled backend)
   - Deployment URL will be provided (e.g., vatici-backend.railway.app)

5. **Test Deployment**
   - Visit: `https://your-railway-url/health`
   - Should return: `{"status":"ok","timestamp":"2026-02-26T..."}`

### Health Check
- Endpoint: `GET /health`
- Response when healthy: `{"status":"ok","timestamp":"..."}`
- Response when database fails: `{"status":"error","message":"Database connection failed"}` (503)

---

## Frontend Update (Vercel)

### Update Environment Variables

1. Go to Vercel dashboard → vatici project → Settings → Environment Variables
2. Add/update:
   ```
   NEXT_PUBLIC_API_URL=https://your-railway-backend-url
   AUTH_SECRET=<same-value-as-backend>
   ```

3. Redeploy frontend:
   - Push a commit to main, OR
   - Click "Redeploy" in Vercel dashboard

### Verify Frontend Connectivity
- Open frontend in browser
- Check browser console (F12) for API calls
- Should see successful requests to `/markets`, `/me/balance`, etc.

---

## Database Setup

### Option A: Using Neon (Current Setup)
1. Database already created at neon.tech
2. Migrations already applied
3. Tables ready for use
4. Use `DATABASE_URL_UNPOOLED` from Neon for transactions

### Option B: Using Railway PostgreSQL
1. Create PostgreSQL service in Railway
2. Railway provides `DATABASE_URL` and `DATABASE_URL_UNPOOLED`
3. Run migrations:
   ```bash
   # From your local machine or Railway shell
   psql $DATABASE_URL_UNPOOLED < backend/database/migrations/001_initial.sql
   psql $DATABASE_URL_UNPOOLED < backend/database/migrations/002_add_multi_choice_support.sql
   # ... etc for all migration files
   ```

---

## Environment Variables Reference

### Backend (Railway)

| Variable | Value | Notes |
|----------|-------|-------|
| `DATABASE_URL_UNPOOLED` | PostgreSQL connection string | Required for transactions (not pooled) |
| `DATABASE_URL` | PostgreSQL pooled connection | Optional, for non-transaction queries |
| `PORT` | `3001` (or auto-assigned by Railway) | Railway can auto-assign |
| `FRONTEND_URL` | `https://v0-vatici-three.vercel.app` | Used for CORS |
| `AUTH_SECRET` | JWT secret (same as frontend) | Used to verify NextAuth tokens |
| `NODE_ENV` | `production` | Enables optimizations |

### Frontend (Vercel)

| Variable | Value | Notes |
|----------|-------|-------|
| `NEXT_PUBLIC_API_URL` | `https://your-railway-url` | Public, used in browser |
| `AUTH_SECRET` | JWT secret (same as backend) | Used by NextAuth |

---

## Troubleshooting

### Backend won't start
- Check Railway deployment logs (Deployments tab)
- Verify all environment variables are set
- Ensure `npm run build` succeeds (check build logs)

### Frontend can't reach backend
- Verify `NEXT_PUBLIC_API_URL` is set in Vercel
- Check frontend browser console (F12) for actual API URLs being called
- Ensure CORS is configured correctly (FRONTEND_URL matches your frontend URL)

### Database connection fails
- Verify `DATABASE_URL_UNPOOLED` is correct (copy from Neon/Railway exactly)
- Check if database exists and migrations have been run
- Test connection locally: `psql $DATABASE_URL_UNPOOLED -c "SELECT 1"`

### Health check fails
- GET `/health` should return 200 with `{"status":"ok",...}`
- If returns 503, database connection is failing
- Check environment variables and database connectivity

---

## Local Development

### Start Backend Locally
```bash
cd backend
npm install
npm run dev:watch
```
- Watches for TypeScript changes
- Reloads server automatically
- Runs on http://localhost:3001

### Start Frontend Locally
```bash
npm install
npm run dev
```
- Runs on http://localhost:3000
- `NEXT_PUBLIC_API_URL` defaults to http://localhost:3001

### Testing Endpoints

```bash
# Health check
curl http://localhost:3001/health

# Get markets (public, no auth)
curl http://localhost:3001/markets?status=open

# Get balance (requires auth header)
curl -H "Authorization: Bearer <JWT>" http://localhost:3001/me/balance

# Place bet (requires auth header)
curl -X POST http://localhost:3001/bets \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{
    "marketId": "...",
    "direction": "YES",
    "amount": 10000
  }'
```

---

## Deployment Checklist

- [ ] Railway account created
- [ ] Neon database created with all migrations applied
- [ ] Backend environment variables configured in Railway:
  - [ ] DATABASE_URL_UNPOOLED
  - [ ] FRONTEND_URL
  - [ ] AUTH_SECRET
  - [ ] NODE_ENV=production
- [ ] Backend deployed and `/health` returns 200
- [ ] Frontend environment variables updated in Vercel:
  - [ ] NEXT_PUBLIC_API_URL set to Railway backend URL
  - [ ] AUTH_SECRET matches backend
- [ ] Frontend redeployed
- [ ] Frontend can fetch `/markets` (check browser console)
- [ ] Can place a bet and see balance update
- [ ] Can view portfolio and activity pages

---

## Support & Debugging

For detailed logs:
- **Railway**: Deployment tab → build/runtime logs
- **Vercel**: Deployments tab → build/runtime logs
- **Neon**: Query Editor or Activity tab for database issues

Monitor database usage:
- Neon console shows current connections and query logs
- Keep an eye on compute resources (CPU, memory)
