-- Seed data for FuelEU Maritime Compliance
-- 5 routes as specified in the assignment

-- Clear existing data (optional - comment out if you want to keep existing data)
-- TRUNCATE TABLE routes CASCADE;

-- Insert 5 routes
INSERT INTO routes (route_id, vessel_type, fuel_type, year, ghg_intensity, fuel_consumption, distance, total_emissions, is_baseline) VALUES
  ('R001', 'Container', 'HFO', 2024, 91.0, 5000.00, 12000.00, 4500.00, FALSE),
  ('R002', 'BulkCarrier', 'LNG', 2024, 88.0, 4800.00, 11500.00, 4200.00, TRUE),  -- Baseline for 2024
  ('R003', 'Tanker', 'MGO', 2024, 93.5, 5100.00, 12500.00, 4700.00, FALSE),
  ('R004', 'RoRo', 'HFO', 2025, 89.2, 4900.00, 11800.00, 4300.00, FALSE),
  ('R005', 'Container', 'LNG', 2025, 90.5, 4950.00, 11900.00, 4400.00, FALSE)
ON CONFLICT (route_id) DO NOTHING;

-- Note: R002 is marked as baseline for 2024
-- You can set a baseline for 2025 by updating R004 or R005:
-- UPDATE routes SET is_baseline = TRUE WHERE route_id = 'R004';

