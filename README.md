
# FuelEU Maritime Compliance Dashboard

A backend-heavy compliance dashboard implementing **FuelEU Maritime Regulation (EU) 2023/1805** Articles 20 (Banking) and 21 (Pooling). Built with Hexagonal Architecture.

## 🏗️ Architecture
- **Adapter Layer**: Express Controllers (HTTP) handling JSON I/O and Unit Conversion (Tonnes ↔ Grams).
- **Application Layer**: Use Cases (`CreatePool`, `ApplyBanked`, `GetComplianceBalance`) implementing business logic.
- **Domain Layer**: Pure logic with Value Objects (`ComplianceBalance`, `GHGIntensity`) and Entities (`Route`).

## 🚀 Setup & Run

### Prerequisites
- Node.js & npm
- PostgreSQL running locally

### Installation
1. Install dependencies:
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```
2. Setup Database:
   - Ensure PostgreSQL is running.
   - Configure `.env` in `backend/` with your `DATABASE_URL`.
   - Setup your database schema (manual or via your preferred tool).

3. Start the Application:
   - **Backend** (Port 3001):
     ```bash
     cd backend
     npm run dev
     ```
   - **Frontend** (Port 5173):
     ```bash
     cd frontend
     npm run dev
     ```

## 🧪 Testing

### Manual Verification
You can use tools like `curl` or Postman to verify the backend application logic.

**1. Check Compliance Balance (R003):**
```bash
curl "http://localhost:3001/api/compliance/cb?shipId=R003&year=2024"
```
*Expected: Returns a negative balance (deficit) in Tonnes.*

**2. Create a Pool (Pooling Logic):**
```bash
curl -X POST http://localhost:3001/api/pools \
  -H "Content-Type: application/json" \
  -d '{
    "year": 2024,
    "members": [
      { "shipId": "R002", "cbBefore": 2000 },
      { "shipId": "R003", "cbBefore": -870 }
    ]
  }'
```
*Expected: Returns updated `cbAfter` values where surplus covers the deficit.*
