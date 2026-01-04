# Environment Setup Guide

## 1. Create `.env` File

### Option A: Use PowerShell Script (Recommended)

```powershell
cd backend
.\create-env.ps1
```

The script will:
- Prompt for your PostgreSQL password
- Automatically URL-encode special characters
- Create `.env` file with correct format

### Option B: Manual Creation

Create `backend/.env` file with:

```env
DATABASE_URL=postgresql://postgres:<URL_ENCODED_PASSWORD>@localhost:5432/fueleu
PORT=3001
```

### URL Encoding Your Password

**Why URL encoding is required:**
- PostgreSQL connection strings use `@` as a delimiter: `postgresql://user:password@host/db`
- If your password contains `@`, it breaks the parsing
- Special characters must be encoded:
  - `@` → `%40`
  - `#` → `%23`
  - `%` → `%25`
  - `&` → `%26`
  - `:` → `%3A`
  - `/` → `%2F`

**Quick encoding in PowerShell:**
```powershell
Add-Type -AssemblyName System.Web
[System.Web.HttpUtility]::UrlEncode("your@password#123")
# Output: your%40password%23123
```

**Example:**
- Password: `my@pass#123`
- Encoded: `my%40pass%23123`
- Full URL: `postgresql://postgres:my%40pass%23123@localhost:5432/fueleu`

---

## 2. Verify Backend Startup

### Start Backend

```powershell
cd backend
npm run dev
```

### Expected Success Output

```
Backend running on port 3001
Health check: http://localhost:3001/health
API routes: http://localhost:3001/api/routes
```

**No errors** = Database connected successfully ✅

### Test Database Connection

**Health Check:**
```powershell
curl http://localhost:3001/health
# Expected: {"status":"ok"}
```

**Get Routes (from database):**
```powershell
curl http://localhost:3001/routes
# Expected: JSON array with 5 routes from seed data
```

**Expected Response:**
```json
[
  {
    "routeId": "R001",
    "vesselType": "Container",
    "fuelType": "HFO",
    "year": 2024,
    "ghgIntensity": 91.0,
    "fuelConsumption": 5000.00,
    "distance": 12000.00,
    "totalEmissions": 4500.00,
    "isBaseline": false
  },
  ...
]
```

---

## 3. Progress Summary

### ✅ Backend Architecture (Complete)

**Domain Layer:**
- Value objects (9 types)
- Route entity with compliance logic
- Domain constants

**Application Layer:**
- 6 use cases (ComputeCB, CompareRoutes, GetCB, BankSurplus, ApplyBanked, CreatePool)

**Ports Layer:**
- RouteRepository interface
- ComplianceRepository interface

**Adapters:**
- 4 HTTP controllers (Routes, Comparison, Banking, Pooling)
- 2 PostgreSQL repositories

**Infrastructure:**
- Express server wired
- PostgreSQL connection pool
- Database schema + seed data

### ✅ Available APIs

- `GET /routes` - All routes
- `POST /routes/:id/baseline` - Set baseline
- `GET /routes/comparison` - Compare routes
- `GET /compliance/cb?shipId&year` - Get CB
- `POST /banking/bank` - Bank surplus
- `POST /banking/apply` - Apply banked
- `POST /pools` - Create pool

### ✅ Database Status

- PostgreSQL 17.x installed
- Database `fueleu` created
- Schema applied
- 5 routes seeded (R002 as baseline)

---

## 4. Upcoming Steps

### Frontend Dashboard (React + TailwindCSS)

**4 Tabs Required:**
1. **Routes Tab** - Display routes, filters, set baseline
2. **Compare Tab** - Baseline comparison, charts, compliance indicators
3. **Banking Tab** - CB display, bank/apply operations, KPIs
4. **Pooling Tab** - Pool creation, member management, validation

**Architecture:**
- Hexagonal pattern: `core/`, `adapters/ui/`, `adapters/infrastructure/`
- React hooks for API integration
- TailwindCSS styling

### Documentation

1. **README.md** - Project overview, setup, API docs, screenshots
2. **AGENT_WORKFLOW.md** - AI agent usage, prompts, observations
3. **REFLECTION.md** - Learning essay (max 1 page)

### Final Checklist

- [ ] Frontend complete (4 tabs)
- [ ] All APIs tested
- [ ] Documentation complete
- [ ] GitHub commits show incremental progress
- [ ] `npm run dev` works for both frontend/backend

