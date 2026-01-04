import { ComplianceBalance } from "../domain/value-objects/ComplianceBalance";
import { ComplianceRepository } from "../ports/ComplianceRepository";
import { Year } from "../domain/value-objects/Year";

/**
 * Use case: Get Compliance Balance
 * 
 * Retrieves compliance balance for a ship in a given year.
 * 
 * Responsibility:
 * - Orchestrates retrieval of compliance balance
 * - Returns ComplianceBalance or null if not found
 * 
 * This is a pure application service with no side effects.
 */
export class GetComplianceBalance {
  constructor(private readonly complianceRepository: ComplianceRepository) {}

  /**
   * Execute the use case
   * @param shipId Ship identifier
   * @param year Year
   * @returns ComplianceBalance or null if not found
   */
  async execute(shipId: string, year: Year): Promise<ComplianceBalance | null> {
    return await this.complianceRepository.findComplianceBalance(shipId, year);
  }
}

