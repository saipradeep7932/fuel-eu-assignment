-- FuelEU Maritime Compliance Database Schema
-- PostgreSQL

-- Routes table
CREATE TABLE IF NOT EXISTS routes (
  id SERIAL PRIMARY KEY,
  route_id TEXT NOT NULL UNIQUE,
  vessel_type TEXT NOT NULL,
  fuel_type TEXT NOT NULL,
  year INTEGER NOT NULL,
  ghg_intensity NUMERIC(10, 4) NOT NULL,
  fuel_consumption NUMERIC(10, 2) NOT NULL,
  distance NUMERIC(10, 2) NOT NULL,
  total_emissions NUMERIC(10, 2) NOT NULL,
  is_baseline BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for routes
CREATE INDEX IF NOT EXISTS idx_routes_year ON routes(year);
CREATE INDEX IF NOT EXISTS idx_routes_baseline ON routes(year, is_baseline) WHERE is_baseline = TRUE;

-- Ship compliance table
CREATE TABLE IF NOT EXISTS ship_compliance (
  id SERIAL PRIMARY KEY,
  ship_id TEXT NOT NULL,
  year INTEGER NOT NULL,
  cb_gco2eq NUMERIC(15, 4) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(ship_id, year)
);

-- Indexes for ship_compliance
CREATE INDEX IF NOT EXISTS idx_ship_compliance_ship_year ON ship_compliance(ship_id, year);

-- Bank entries table (for tracking banked surpluses)
CREATE TABLE IF NOT EXISTS bank_entries (
  id SERIAL PRIMARY KEY,
  ship_id TEXT NOT NULL,
  year INTEGER NOT NULL,
  amount_gco2eq NUMERIC(15, 4) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for bank_entries
CREATE INDEX IF NOT EXISTS idx_bank_entries_ship_year ON bank_entries(ship_id, year);

-- Pools table
CREATE TABLE IF NOT EXISTS pools (
  id SERIAL PRIMARY KEY,
  year INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pool members table
CREATE TABLE IF NOT EXISTS pool_members (
  id SERIAL PRIMARY KEY,
  pool_id INTEGER NOT NULL REFERENCES pools(id) ON DELETE CASCADE,
  ship_id TEXT NOT NULL,
  cb_before NUMERIC(15, 4) NOT NULL,
  cb_after NUMERIC(15, 4) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for pool_members
CREATE INDEX IF NOT EXISTS idx_pool_members_pool ON pool_members(pool_id);
CREATE INDEX IF NOT EXISTS idx_pool_members_ship ON pool_members(ship_id);

