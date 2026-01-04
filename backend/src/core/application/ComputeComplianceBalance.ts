import { Route } from "../domain/Route";
import { ComplianceBalance } from "../domain/value-objects/ComplianceBalance";

/**
 * Use case: Compute Compliance Balance
 * 
 * Calculates the compliance balance for a given route based on target GHG intensity.
 * 
 * Responsibility:
 * - Orchestrates the compliance balance calculation
 * - Delegates to Route domain entity for business logic
 * - Returns the calculated ComplianceBalance value object
 * 
 * This is a pure application service with no side effects.
 */
export class ComputeComplianceBalance {
  /**
   * Execute the use case
   * @param route Route entity to calculate CB for
   * @param targetIntensity Target GHG intensity (gCO₂e/MJ)
   * @returns ComplianceBalance value object
   */
  execute(route: Route, targetIntensity: number): ComplianceBalance {
    return route.calculateComplianceBalance(targetIntensity);
  }
}

