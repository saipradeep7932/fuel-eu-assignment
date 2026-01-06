# FuelEU Maritime Assignment - Final Audit & Verification Report

## 1. Mismatch List & Fixes

### Backend Fixes
| Area | Issue | Fix Applied | Spec Compliance |
| :--- | :--- | :--- | :--- |
| **Banking** | `POST /banking/apply` did not validate if enough banked surplus existed and did not deduct. | Updated `ApplyBanked.ts` to check `getTotalBanked` (sum of all entries) and insert a negative entry to deduct usage. | ✅ Article 20 |
| **Pooling** | `POST /pools` used surplus to cover deficits but did not deduct from donor ships (creating "free" compliance). | Rewrote `CreatePool.ts` to use greedy allocation (Sort by CB desc -> Cover deficits) and deduct transferred amount from donor's `cbAfter`. | ✅ Article 21 |
| **Comparison** | `GET /routes/comparison` filtered by `vesselType` incorrectly, hiding valid comparison routes. | Removed `vesselType` filter in `ComparisonController.ts` and `Route.ts` (`canCompareWith`). Now compares all routes within the same year. | ✅ Spec Requirement |
| **Baseline** | Baseline ships shouldn't have CB. | Validated `BankingController` returns 400 for baseline. Frontend handles this. | ✅ Spec Requirement |

### Frontend Fixes
| Area | Issue | Fix Applied |
| :--- | :--- | :--- |
| **Compare Tab** | Table only showed baseline; no visual indicators. | Added Trend Arrows (↑/↓), Status, and a Bar Chart visualization. Removed client-side filtering that might hide data. |
| **Banking Tab** | Error handling was poor; buttons active when invalid. | Added inline error messages, disabled "Apply" button if CB ≥ 0 or neutral. |
| **Pooling Tab** | Result table didn't show flow. | Added "Role" column (Donor/Receiver), highlighted changes, and clearly showed "Before -> After" values. |

## 2. Postman Verification Steps

Use these exact requests to verify the fixes.

### A. Set Baseline
```bash
curl -X POST http://localhost:3001/api/routes/R001/baseline
```
**Expected**: 200 OK `{ "message": "Route set as baseline successfully" }`

### B. Get Comparison (Verify Filtering Fix)
```bash
curl "http://localhost:3001/api/routes/comparison?year=2024"
```
**Expected**: 200 OK. JSON should contain `comparisons` array with **ALL** non-baseline routes for 2024, regardless of vessel type.

### C. Check Compliance Balance
```bash
curl "http://localhost:3001/api/compliance/cb?shipId=R002&year=2024"
```
**Expected**: 200 OK `{ "cb": 500, "isSurplus": true ... }` (Assuming R002 has surplus).

### D. Bank Surplus
```bash
curl -X POST http://localhost:3001/api/banking/bank \
  -H "Content-Type: application/json" \
  -d '{ "shipId": "R002", "year": 2024, "amount": 200 }'
```
**Expected**: 200 OK.

### E. Apply Banked Surplus (Verify Deduction Fix)
*Pre-requisite: R003 has deficit (-300) and R002 has banked surplus.*
```bash
curl -X POST http://localhost:3001/api/banking/apply \
  -H "Content-Type: application/json" \
  -d '{ "shipId": "R003", "year": 2024, "amount": 100 }'
```
**Expected**: 200 OK. `cbAfter` should improve.
**Verify Deduction**:
```bash
curl -X POST http://localhost:3001/api/banking/apply \
  -H "Content-Type: application/json" \
  -d '{ "shipId": "R003", "year": 2024, "amount": 999999 }'
```
**Expected**: 400 Bad Request (Insufficient banked surplus). This confirms the validation logic works.

### F. Create Pool (Verify Logic Fix)
```bash
curl -X POST http://localhost:3001/api/pools \
  -H "Content-Type: application/json" \
  -d '{
    "year": 2024,
    "members": [
      { "shipId": "R002", "cbBefore": 500 },
      { "shipId": "R003", "cbBefore": -300 }
    ]
  }'
```
**Expected Response**:
```json
{
  "valid": true,
  "members": [
    { "shipId": "R002", "cbBefore": 500, "cbAfter": 200 }, // Deducted 300
    { "shipId": "R003", "cbBefore": -300, "cbAfter": 0 }  // Covered
  ]
}
```
*Note: R002 cbAfter MUST be 200. If it is 500, the fix failed.*

## 3. Verification Checklist

- [x] **Backend**: Routes & Comparison Logic (Fixed filtering)
- [x] **Backend**: Banking Validation & Deduction (Fixed `ApplyBanked`)
- [x] **Backend**: Pooling Allocation (Fixed `CreatePool`)
- [x] **Frontend**: Compare Tab Trends & Charts
- [x] **Frontend**: Banking UX (Disabled states, Errors)
- [x] **Frontend**: Pooling Visualization (Donors vs Receivers)
- [x] **Database**: Schema Usage Verified (Correct tables used)

All items strictly audited and fixed.
