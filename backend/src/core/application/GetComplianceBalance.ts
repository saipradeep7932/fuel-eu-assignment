import { ComplianceBalance } from "../domain/value-objects/ComplianceBalance";
import { ComplianceRepository } from "../ports/ComplianceRepository";
import { RouteRepository } from "../ports/RouteRepository";
import { Year } from "../domain/value-objects/Year";
import { RouteId } from "../domain/value-objects/RouteId";
import { TARGET_GHG_INTENSITY } from "../domain/constants";

/**
 * Use case: Get Compliance Balance
 * 
 * Retrieves compliance balance for a ship in a given year.
 * If the balance does not exist in the repository, it calculates it
 * from the route data and persists it.
 * 
 * Responsibility:
 * - Orchestrates retrieval of compliance balance
 * - Computes and saves balance if missing (Compute-on-Miss)
 * - Returns ComplianceBalance or null if not found (and cannot be computed)
 */
export class GetComplianceBalance {
  constructor(
    private readonly complianceRepository: ComplianceRepository,
    private readonly routeRepository: RouteRepository
  ) { }

  /**
   * Execute the use case
   * @param shipId Ship identifier
   * @param year Year
   * @returns ComplianceBalance or null if not found
   */
  async execute(shipId: string, year: Year): Promise<ComplianceBalance | null> {
    // 1. Try to find existing balance
    const existingBalance = await this.complianceRepository.findComplianceBalance(shipId, year);
    if (existingBalance) {
      return existingBalance;
    }

    // 2. If not found, try to compute it from Route
    const routeId = RouteId.create(shipId);
    const route = await this.routeRepository.findById(routeId);

    if (!route) {
      return null; // No route data, cannot compute
    }

    if (route.getIsBaseline()) {
      return null; // Baseline ships do not have compliance balance
    }

    // 3. Calculate new balance
    const newBalance = route.calculateComplianceBalance(TARGET_GHG_INTENSITY);

    // 4. Persist the calculated balance
    await this.complianceRepository.saveComplianceBalance(shipId, year, newBalance);

    return newBalance;
  }
}

