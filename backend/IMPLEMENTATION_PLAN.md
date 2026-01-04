# FuelEU Maritime - Domain Layer Implementation Plan

## 📋 Overview

This document outlines the step-by-step implementation plan for building the **Route domain layer** following Clean Architecture / Hexagonal Architecture principles.

## 🏗️ Target Structure

```
backend/src/core/domain/
├── constants.ts                    # Domain constants
│   └── TARGET_GHG_INTENSITY, ENERGY_CONVERSION_FACTOR
│
├── value-objects/
│   ├── RouteId.ts                 # Route identifier
│   ├── Year.ts                    # Year validation
│   ├── VesselType.ts              # Vessel type enum + VO
│   ├── FuelType.ts                # Fuel type enum + VO
│   ├── Distance.ts                # Distance (km)
│   ├── TotalEmissions.ts          # Total emissions (t CO₂e)
│   ├── FuelConsumption.ts         # Fuel consumption (t) + energy conversion
│   ├── GHGIntensity.ts            # GHG intensity (gCO₂e/MJ) + compliance logic
│   ├── ComplianceBalance.ts       # CB calculation + banking logic
│   └── index.ts                   # Barrel export
│
├── Route.ts                        # Route domain entity
└── index.ts                        # Domain layer barrel export
```

## 🎯 Implementation Strategy

### Phase 1: Foundation (Constants & Simple VOs)
**Goal**: Establish domain constants and basic value objects

1. **Step 1.1**: Create domain constants
   - File: `constants.ts`
   - Content: TARGET_GHG_INTENSITY, ENERGY_CONVERSION_FACTOR
   - Commit: `feat(domain): add domain constants`

2. **Step 1.2**: Create RouteId value object
   - File: `value-objects/RouteId.ts`
   - Validation: Non-empty string
   - Commit: `feat(domain): add RouteId value object`

3. **Step 1.3**: Create Year value object
   - File: `value-objects/Year.ts`
   - Validation: Integer, range 2000-2100
   - Commit: `feat(domain): add Year value object`

### Phase 2: Enum-based Value Objects
**Goal**: Add type-safe enums for vessel and fuel types

4. **Step 2.1**: Create VesselType value object
   - File: `value-objects/VesselType.ts`
   - Enum: Container, BulkCarrier, Tanker, RoRo
   - Commit: `feat(domain): add VesselType value object with enum`

5. **Step 2.2**: Create FuelType value object
   - File: `value-objects/FuelType.ts`
   - Enum: HFO, LNG, MGO
   - Commit: `feat(domain): add FuelType value object with enum`

### Phase 3: Measurement Value Objects
**Goal**: Add value objects for route measurements

6. **Step 3.1**: Create Distance value object
   - File: `value-objects/Distance.ts`
   - Validation: Positive number, finite
   - Commit: `feat(domain): add Distance value object`

7. **Step 3.2**: Create TotalEmissions value object
   - File: `value-objects/TotalEmissions.ts`
   - Validation: Non-negative, finite
   - Commit: `feat(domain): add TotalEmissions value object`

8. **Step 3.3**: Create FuelConsumption value object
   - File: `value-objects/FuelConsumption.ts`
   - Validation: Positive, finite
   - Method: `toEnergyInScope(conversionFactor)`
   - Commit: `feat(domain): add FuelConsumption value object with energy conversion`

9. **Step 3.4**: Create GHGIntensity value object
   - File: `value-objects/GHGIntensity.ts`
   - Validation: Non-negative, finite
   - Methods: `isCompliant(target)`, `percentDifferenceFrom(baseline)`
   - Commit: `feat(domain): add GHGIntensity value object with compliance logic`

### Phase 4: Business Logic Value Objects
**Goal**: Add compliance balance with banking logic

10. **Step 4.1**: Create ComplianceBalance value object
    - File: `value-objects/ComplianceBalance.ts`
    - Static method: `calculate(target, actual, energyInScope)`
    - Methods: `isSurplus()`, `isDeficit()`, `isCompliant()`, `canApply(amount)`
    - Commit: `feat(domain): add ComplianceBalance value object with banking logic`

### Phase 5: Domain Entity
**Goal**: Create Route entity aggregating all value objects

11. **Step 5.1**: Create Route entity
    - File: `Route.ts`
    - Factory: `Route.create(...)`
    - Methods: 
      - `calculateComplianceBalance()`
      - `isCompliant()`
      - `percentDifferenceFrom(baseline)`
      - `markAsBaseline()` / `unmarkAsBaseline()`
      - `canCompareWith(other)`
    - Commit: `feat(domain): add Route entity with compliance calculation logic`

### Phase 6: Exports & Integration
**Goal**: Set up barrel exports for clean imports

12. **Step 6.1**: Create value-objects barrel export
    - File: `value-objects/index.ts`
    - Export all value objects
    - Commit: `feat(domain): add value-objects barrel export`

13. **Step 6.2**: Create domain layer barrel export
    - File: `domain/index.ts`
    - Export Route, all VOs, constants
    - Commit: `feat(domain): add domain layer barrel export`

## 📐 Design Principles

### 1. **Immutability**
- All value objects and entities are immutable
- Methods return new instances when state changes

### 2. **Type Safety**
- Strong TypeScript typing with strict mode
- Validation in constructors (private constructors + static factories)

### 3. **Business Logic Encapsulation**
- Domain logic lives in domain layer
- No framework dependencies (Express, DB, etc.)

### 4. **Value Objects**
- Small, focused objects
- Validation + behavior
- Equality based on value, not identity

### 5. **Domain Entity**
- Route aggregates value objects
- Provides business methods
- Identity based on RouteId

## 🔍 Key Formulas

### Compliance Balance (CB)
```
CB = (Target Intensity - Actual Intensity) × Energy in Scope
Energy in Scope (MJ) = Fuel Consumption (t) × 41,000 MJ/t
```

### Percentage Difference
```
% Difference = ((Comparison / Baseline) - 1) × 100
```

### Compliance Check
```
Compliant = Actual Intensity ≤ Target Intensity (89.3368 gCO₂e/MJ)
```

## ✅ Validation Rules

### RouteId
- Cannot be empty
- Must be non-whitespace string

### Year
- Must be integer
- Range: 2000-2100

### VesselType
- Must be one of: Container, BulkCarrier, Tanker, RoRo

### FuelType
- Must be one of: HFO, LNG, MGO
- Case-insensitive input, normalized to uppercase

### Measurements (Distance, TotalEmissions, FuelConsumption, GHGIntensity)
- Must be finite numbers
- Distance, FuelConsumption: Must be positive (> 0)
- TotalEmissions, GHGIntensity: Must be non-negative (≥ 0)

## 🧪 Testing Strategy (Future)

After domain layer completion:
- Unit tests for each value object validation
- Unit tests for Route entity business logic
- Edge case testing (zero values, boundary conditions)

## 📝 Commit Message Convention

Format: `feat(domain): <description>`

Examples:
- `feat(domain): add domain constants`
- `feat(domain): add RouteId value object`
- `feat(domain): add Route entity with compliance calculation logic`

## 🚀 Next Steps After Domain Layer

1. **Application Layer**: Use cases (GetRoutes, SetBaseline, CalculateCB, etc.)
2. **Ports Layer**: Interfaces (RouteRepository, ComplianceService, etc.)
3. **Adapters Layer**: 
   - Inbound: HTTP controllers (Express routes)
   - Outbound: Database repositories (PostgreSQL)
4. **Infrastructure Layer**: 
   - Database setup (migrations, seeds)
   - Server configuration

---

**Status**: 📋 Plan Created - Ready for Implementation
**Last Updated**: 2025-01-04

