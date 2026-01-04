import { Route } from "../domain/Route";
import { RouteId } from "../domain/value-objects/RouteId";
import { Year } from "../domain/value-objects/Year";

/**
 * Port: Route Repository
 * 
 * Defines the interface for route persistence operations.
 * This is an outbound port (driven port) that will be implemented
 * by adapters in the infrastructure layer (e.g., PostgreSQL adapter).
 * 
 * Responsibility:
 * - Defines contract for route data access
 * - Abstracts persistence details from application layer
 * - Enables dependency inversion (core depends on abstraction, not implementation)
 * 
 * Implementations will be provided by adapters (e.g., PostgresRouteRepository).
 */
export interface RouteRepository {
  /**
   * Find all routes
   * @returns Promise resolving to array of all routes
   */
  findAll(): Promise<Route[]>;

  /**
   * Find route by ID
   * @param routeId Route identifier
   * @returns Promise resolving to Route or null if not found
   */
  findById(routeId: RouteId): Promise<Route | null>;

  /**
   * Find baseline route for a given year
   * @param year Year to find baseline for
   * @returns Promise resolving to baseline Route or null if not found
   */
  findBaseline(year: Year): Promise<Route | null>;

  /**
   * Save a route (create or update)
   * @param route Route entity to save
   * @returns Promise that resolves when route is saved
   */
  save(route: Route): Promise<void>;

  /**
   * Set a route as baseline for its year
   * This should unmark any existing baseline for that year
   * @param routeId Route identifier to set as baseline
   * @returns Promise that resolves when baseline is set
   */
  setBaseline(routeId: RouteId): Promise<void>;
}

