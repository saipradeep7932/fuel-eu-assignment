# Database Setup - Complete

## 1. Environment Configuration

### Create `.env` file

Create `backend/.env` with the following content:

```env
DATABASE_URL=postgresql://postgres:<URL_ENCODED_PASSWORD>@localhost:5432/fueleu
PORT=3001
```

### URL Encoding for Password

**Why URL encoding is required:**
- PostgreSQL connection strings use `@` as a delimiter between credentials and host
- If your password contains `@`, it will be interpreted as the delimiter, breaking the connection
- Special characters in passwords must be URL-encoded:
  - `@` → `%40`
  - `#` → `%23`
  - `%` → `%25`
  - `&` → `%26`
  - `:` → `%3A`
  - `/` → `%2F`
  - `?` → `%3F`
  - `=` → `%3D`

**Example:**
- Password: `my@pass#123`
- URL-encoded: `my%40pass%23123`
- Full DATABASE_URL: `postgresql://postgres:my%40pass%23123@localhost:5432/fueleu`

**Quick encoding:**
- Use online tool: https://www.urlencoder.org/
- Or PowerShell: `[System.Web.HttpUtility]::UrlEncode("your@password")`

---

## 2. Backend Startup Verification

### Step 1: Start Backend Server

```powershell
cd backend
npm run dev
```

**Expected output:**
```
Backend running on port 3001
Health check: http://localhost:3001/health
API routes: http://localhost:3001/api/routes
```

### Step 2: Verify Database Connection

The server should start **without connection errors**. If you see:
- ✅ No errors → Database connected successfully
- ❌ "Connection refused" → PostgreSQL service not running
- ❌ "Authentication failed" → Check password encoding in DATABASE_URL

### Step 3: Test API Endpoints

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

**Get Routes Comparison:**
```powershell
curl http://localhost:3001/routes/comparison
# Expected: JSON with baseline and comparisons
```

---

## 3. Progress Summary

### ✅ Backend Architecture (Complete)

**Domain Layer:**
- ✅ Value objects (RouteId, Year, VesselType, FuelType, Distance, TotalEmissions, FuelConsumption, GHGIntensity, ComplianceBalance)
- ✅ Route domain entity with compliance calculation logic
- ✅ Domain constants (TARGET_GHG_INTENSITY, ENERGY_CONVERSION_FACTOR)

**Application Layer:**
- ✅ ComputeComplianceBalance use case
- ✅ CompareRoutes use case
- ✅ GetComplianceBalance use case
- ✅ BankSurplus use case
- ✅ ApplyBanked use case
- ✅ CreatePool use case (with greedy allocation)

**Ports Layer:**
- ✅ RouteRepository interface
- ✅ ComplianceRepository interface

**Adapters Layer:**
- ✅ Inbound HTTP adapters:
  - RoutesController (GET /routes, POST /routes/:id/baseline)
  - ComparisonController (GET /routes/comparison)
  - BankingController (GET /compliance/cb, POST /banking/bank, POST /banking/apply)
  - PoolingController (POST /pools)
- ✅ Outbound PostgreSQL adapters:
  - PostgresRouteRepository
  - PostgresComplianceRepository

**Infrastructure Layer:**
- ✅ Express server with route wiring
- ✅ PostgreSQL connection pool (pgClient.ts)
- ✅ Database schema (schema.sql)
- ✅ Seed data (seed.sql)

### ✅ Key APIs Available

| Endpoint | Method | Purpose |
|----------|--------|--------|
| `/health` | GET | Health check |
| `/routes` | GET | Get all routes |
| `/routes/:id/baseline` | POST | Set route as baseline |
| `/routes/comparison` | GET | Compare routes with baseline |
| `/compliance/cb` | GET | Get compliance balance |
| `/banking/bank` | POST | Bank surplus (Article 20) |
| `/banking/apply` | POST | Apply banked surplus |
| `/pools` | POST | Create compliance pool (Article 21) |

### ✅ Database Status

- ✅ PostgreSQL 17.x installed and accessible
- ✅ Database `fueleu` created
- ✅ Schema applied (routes, ship_compliance, bank_entries, pools, pool_members)
- ✅ Seed data loaded (5 routes, R002 as baseline for 2024)
- ✅ Connection configured via `.env` file

---

## 4. Upcoming Steps (NOT Implemented Yet)

### Frontend Dashboard (React + TailwindCSS)

**Required Components:**
1. **Routes Tab**
   - Display routes table
   - Filters (vesselType, fuelType, year)
   - "Set Baseline" button
   - Fetch from `GET /routes`

2. **Compare Tab**
   - Baseline vs comparison routes
   - Percentage difference calculation
   - Compliance indicators (✅/❌)
   - Chart visualization (bar/line)
   - Fetch from `GET /routes/comparison`

3. **Banking Tab**
   - Display current CB
   - Bank surplus button
   - Apply banked surplus button
   - KPIs (cb_before, applied, cb_after)
   - Endpoints: `GET /compliance/cb`, `POST /banking/bank`, `POST /banking/apply`

4. **Pooling Tab**
   - List pool members
   - Before/after CB display
   - Pool sum indicator (red/green)
   - Create pool button
   - Endpoint: `POST /pools`

**Architecture:**
- Hexagonal pattern: `core/`, `adapters/ui/`, `adapters/infrastructure/`
- React hooks for API calls
- TailwindCSS for styling

### Documentation

1. **README.md**
   - Project overview
   - Architecture summary (hexagonal)
   - Setup instructions (backend + frontend)
   - API endpoints documentation
   - Screenshots/sample requests

2. **AGENT_WORKFLOW.md**
   - List all AI agents used (Cursor Agent, etc.)
   - Example prompts and outputs
   - Validation/corrections made
   - Observations (where agent saved time, where it failed)
   - Best practices followed

3. **REFLECTION.md**
   - Short essay (max 1 page)
   - What you learned using AI agents
   - Efficiency gains vs manual coding
   - Improvements for next time

### Final Submission Checklist

- [ ] Frontend dashboard complete (all 4 tabs)
- [ ] Backend APIs tested and working
- [ ] Database seeded and verified
- [ ] README.md complete
- [ ] AGENT_WORKFLOW.md complete
- [ ] REFLECTION.md complete
- [ ] All code committed to GitHub
- [ ] `npm run dev` works for both frontend and backend
- [ ] `npm run test` passes (if tests added)
- [ ] Commit history shows incremental progress

---

## Quick Reference

**Start Backend:**
```powershell
cd backend
npm run dev
```

**Test Database Connection:**
```powershell
curl http://localhost:3001/routes
```

**Check Environment:**
```powershell
# Verify .env file exists
Test-Path backend/.env

# View .env (be careful with password)
Get-Content backend/.env
```

