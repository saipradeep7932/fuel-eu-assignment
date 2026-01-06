import { Route } from "../domain/Route";

/**
 * Comparison result DTO
 */
export interface RouteComparisonResult {
  baselineIntensity: number;
  comparisonIntensity: number;
  percentDifference: number;
  compliant: boolean;
}

/**
 * Use case: Compare Routes
 * 
 * Compares a comparison route against a baseline route to determine
 * compliance and percentage difference.
 * 
 * Responsibility:
 * - Validates that routes can be compared (same year, same vessel type)
 * - Orchestrates the comparison calculation
 * - Delegates to Route domain entity for business logic
 * - Returns structured comparison result
 * 
 * This is a pure application service with no side effects.
 */
export class CompareRoutes {
  /**
   * Execute the use case
   * @param baselineRoute Baseline route for comparison
   * @param comparisonRoute Route to compare against baseline
   * @param targetIntensity Target GHG intensity (gCO₂e/MJ)
   * @returns RouteComparisonResult with comparison data
   * @throws Error if routes cannot be compared
   */
  execute(
    baselineRoute: Route,
    comparisonRoute: Route,
    targetIntensity: number
  ): RouteComparisonResult {
    // Validate that routes can be compared
    if (!comparisonRoute.canCompareWith(baselineRoute)) {
      throw new Error(
        "Routes cannot be compared: must have same year"
      );
    }

    // Calculate percentage difference
    const percentDifference = comparisonRoute.percentDifferenceFrom(
      baselineRoute
    );

    // Check compliance
    const compliant = comparisonRoute.isCompliant(targetIntensity);

    return {
      baselineIntensity: baselineRoute.getGHGIntensity().getValue(),
      comparisonIntensity: comparisonRoute.getGHGIntensity().getValue(),
      percentDifference,
      compliant,
    };
  }
}

