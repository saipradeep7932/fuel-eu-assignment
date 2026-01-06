import { RouteId } from "./value-objects/RouteId";
import { VesselType } from "./value-objects/VesselType";
import { FuelType } from "./value-objects/FuelType";
import { Year } from "./value-objects/Year";
import { GHGIntensity } from "./value-objects/GHGIntensity";
import { FuelConsumption } from "./value-objects/FuelConsumption";
import { Distance } from "./value-objects/Distance";
import { TotalEmissions } from "./value-objects/TotalEmissions";
import { ComplianceBalance } from "./value-objects/ComplianceBalance";
import { ENERGY_CONVERSION_FACTOR } from "./constants";

/**
 * Route domain entity
 * Represents a vessel route with fuel consumption and emissions data
 * Aggregate root for route compliance calculations
 */
export class Route {
  private constructor(
    private readonly routeId: RouteId,
    private readonly vesselType: VesselType,
    private readonly fuelType: FuelType,
    private readonly year: Year,
    private readonly ghgIntensity: GHGIntensity,
    private readonly fuelConsumption: FuelConsumption,
    private readonly distance: Distance,
    private readonly totalEmissions: TotalEmissions,
    private readonly isBaseline: boolean
  ) { }

  /**
   * Create a new Route instance
   * @param routeId Route identifier
   * @param vesselType Vessel type (Container, BulkCarrier, Tanker, RoRo)
   * @param fuelType Fuel type (HFO, LNG, MGO)
   * @param year Year (2000-2100)
   * @param ghgIntensity GHG intensity (gCO₂e/MJ)
   * @param fuelConsumption Fuel consumption (tonnes)
   * @param distance Distance (kilometers)
   * @param totalEmissions Total emissions (tonnes CO₂e)
   * @param isBaseline Whether this route is a baseline (default: false)
   * @returns Route instance
   */
  static create(
    routeId: string,
    vesselType: string,
    fuelType: string,
    year: number,
    ghgIntensity: number,
    fuelConsumption: number,
    distance: number,
    totalEmissions: number,
    isBaseline: boolean = false
  ): Route {
    return new Route(
      RouteId.create(routeId),
      VesselType.create(vesselType),
      FuelType.create(fuelType),
      Year.create(year),
      GHGIntensity.create(ghgIntensity),
      FuelConsumption.create(fuelConsumption),
      Distance.create(distance),
      TotalEmissions.create(totalEmissions),
      isBaseline
    );
  }

  /**
   * Calculate Compliance Balance (CB) for this route
   * Formula: CB = (Target - Actual) × Energy in scope
   * @param targetIntensity Target GHG intensity (gCO₂e/MJ)
   * @returns ComplianceBalance instance
   */
  calculateComplianceBalance(targetIntensity: number): ComplianceBalance {
    const energyInScope = this.fuelConsumption.toEnergyInScope(
      ENERGY_CONVERSION_FACTOR
    );

    return ComplianceBalance.calculate(
      targetIntensity,
      this.ghgIntensity.getValue(),
      energyInScope
    );
  }

  /**
   * Check if this route is compliant with target intensity
   * @param targetIntensity Target GHG intensity (gCO₂e/MJ)
   * @returns true if route is compliant
   */
  isCompliant(targetIntensity: number): boolean {
    return this.ghgIntensity.isCompliant(targetIntensity);
  }

  /**
   * Calculate percentage difference from baseline route
   * Formula: ((comparison / baseline) - 1) × 100
   * @param baselineRoute Baseline route for comparison
   * @returns Percentage difference as a number
   */
  percentDifferenceFrom(baselineRoute: Route): number {
    return this.ghgIntensity.percentDifferenceFrom(baselineRoute.ghgIntensity);
  }

  /**
   * Mark this route as baseline
   * Returns a new Route instance with isBaseline = true
   * @returns New Route instance marked as baseline
   */
  markAsBaseline(): Route {
    return new Route(
      this.routeId,
      this.vesselType,
      this.fuelType,
      this.year,
      this.ghgIntensity,
      this.fuelConsumption,
      this.distance,
      this.totalEmissions,
      true
    );
  }

  /**
   * Unmark this route as baseline
   * Returns a new Route instance with isBaseline = false
   * @returns New Route instance unmarked as baseline
   */
  unmarkAsBaseline(): Route {
    return new Route(
      this.routeId,
      this.vesselType,
      this.fuelType,
      this.year,
      this.ghgIntensity,
      this.fuelConsumption,
      this.distance,
      this.totalEmissions,
      false
    );
  }

  /**
   * Check if this route can be compared with another route
   * Routes can be compared if they have the same year and vessel type
   * @param otherRoute Other route to compare with
   * @returns true if routes can be compared
   */
  canCompareWith(otherRoute: Route): boolean {
    return this.year.equals(otherRoute.year);
  }

  // Getters
  getRouteId(): RouteId {
    return this.routeId;
  }

  getVesselType(): VesselType {
    return this.vesselType;
  }

  getFuelType(): FuelType {
    return this.fuelType;
  }

  getYear(): Year {
    return this.year;
  }

  getGHGIntensity(): GHGIntensity {
    return this.ghgIntensity;
  }

  getFuelConsumption(): FuelConsumption {
    return this.fuelConsumption;
  }

  getDistance(): Distance {
    return this.distance;
  }

  getTotalEmissions(): TotalEmissions {
    return this.totalEmissions;
  }

  getIsBaseline(): boolean {
    return this.isBaseline;
  }

  /**
   * Check equality with another route
   * Routes are equal if they have the same RouteId
   * @param other Other route to compare
   * @returns true if routes are equal
   */
  equals(other: Route): boolean {
    return this.routeId.equals(other.routeId);
  }
}

