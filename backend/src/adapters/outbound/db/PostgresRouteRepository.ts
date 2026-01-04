import { Pool, PoolClient } from "pg";
import { RouteRepository } from "../../../core/ports/RouteRepository";
import { Route } from "../../../core/domain/Route";
import { RouteId } from "../../../core/domain/value-objects/RouteId";
import { Year } from "../../../core/domain/value-objects/Year";

/**
 * Database row structure for routes table
 */
interface RouteRow {
  id: number;
  route_id: string;
  vessel_type: string;
  fuel_type: string;
  year: number;
  ghg_intensity: number;
  fuel_consumption: number;
  distance: number;
  total_emissions: number;
  is_baseline: boolean;
}

/**
 * PostgreSQL implementation of RouteRepository
 * 
 * Maps database rows to domain entities and vice versa.
 * Handles only persistence logic, no business logic.
 */
export class PostgresRouteRepository implements RouteRepository {
  constructor(private readonly db: Pool | PoolClient) {}

  /**
   * Find all routes
   */
  async findAll(): Promise<Route[]> {
    const result = await this.db.query<RouteRow>(
      "SELECT * FROM routes ORDER BY year, route_id"
    );
    return result.rows.map((row) => this.rowToRoute(row));
  }

  /**
   * Find route by ID
   */
  async findById(routeId: RouteId): Promise<Route | null> {
    const result = await this.db.query<RouteRow>(
      "SELECT * FROM routes WHERE route_id = $1",
      [routeId.getValue()]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.rowToRoute(result.rows[0]);
  }

  /**
   * Find baseline route for a given year
   */
  async findBaseline(year: Year): Promise<Route | null> {
    const result = await this.db.query<RouteRow>(
      "SELECT * FROM routes WHERE year = $1 AND is_baseline = true LIMIT 1",
      [year.getValue()]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.rowToRoute(result.rows[0]);
  }

  /**
   * Save a route (create or update)
   */
  async save(route: Route): Promise<void> {
    const routeId = route.getRouteId().getValue();
    const existing = await this.findById(route.getRouteId());

    if (existing) {
      // Update existing route
      await this.db.query(
        `UPDATE routes SET
          vessel_type = $1,
          fuel_type = $2,
          year = $3,
          ghg_intensity = $4,
          fuel_consumption = $5,
          distance = $6,
          total_emissions = $7,
          is_baseline = $8
        WHERE route_id = $9`,
        [
          route.getVesselType().getValue(),
          route.getFuelType().getValue(),
          route.getYear().getValue(),
          route.getGHGIntensity().getValue(),
          route.getFuelConsumption().getValue(),
          route.getDistance().getValue(),
          route.getTotalEmissions().getValue(),
          route.getIsBaseline(),
          routeId,
        ]
      );
    } else {
      // Insert new route
      await this.db.query(
        `INSERT INTO routes (
          route_id, vessel_type, fuel_type, year,
          ghg_intensity, fuel_consumption, distance,
          total_emissions, is_baseline
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          routeId,
          route.getVesselType().getValue(),
          route.getFuelType().getValue(),
          route.getYear().getValue(),
          route.getGHGIntensity().getValue(),
          route.getFuelConsumption().getValue(),
          route.getDistance().getValue(),
          route.getTotalEmissions().getValue(),
          route.getIsBaseline(),
        ]
      );
    }
  }

  /**
   * Set a route as baseline for its year
   * Unmarks any existing baseline for that year
   */
  async setBaseline(routeId: RouteId): Promise<void> {
    // First, get the route to find its year
    const route = await this.findById(routeId);
    if (!route) {
      throw new Error(`Route not found: ${routeId.getValue()}`);
    }

    const year = route.getYear().getValue();

    // Unmark all baselines for this year
    await this.db.query(
      "UPDATE routes SET is_baseline = false WHERE year = $1",
      [year]
    );

    // Mark this route as baseline
    await this.db.query(
      "UPDATE routes SET is_baseline = true WHERE route_id = $1",
      [routeId.getValue()]
    );
  }

  /**
   * Map database row to Route domain entity
   */
  private rowToRoute(row: RouteRow): Route {
    return Route.create(
      row.route_id,
      row.vessel_type,
      row.fuel_type,
      row.year,
      row.ghg_intensity,
      row.fuel_consumption,
      row.distance,
      row.total_emissions,
      row.is_baseline
    );
  }
}

