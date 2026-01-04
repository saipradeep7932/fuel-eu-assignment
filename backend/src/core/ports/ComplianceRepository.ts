import { ComplianceBalance } from "../domain/value-objects/ComplianceBalance";
import { Year } from "../domain/value-objects/Year";

/**
 * Port: Compliance Repository
 * 
 * Defines the interface for compliance balance persistence operations.
 * This is an outbound port (driven port) that will be implemented
 * by adapters in the infrastructure layer (e.g., PostgreSQL adapter).
 * 
 * Responsibility:
 * - Defines contract for compliance balance data access
 * - Abstracts persistence details from application layer
 * - Enables dependency inversion (core depends on abstraction, not implementation)
 * 
 * Implementations will be provided by adapters (e.g., PostgresComplianceRepository).
 */
export interface ComplianceRepository {
  /**
   * Save compliance balance for a ship in a given year
   * @param shipId Ship identifier
   * @param year Year of compliance
   * @param balance Compliance balance to save
   * @returns Promise that resolves when balance is saved
   */
  saveComplianceBalance(
    shipId: string,
    year: Year,
    balance: ComplianceBalance
  ): Promise<void>;

  /**
   * Find compliance balance for a ship in a given year
   * @param shipId Ship identifier
   * @param year Year of compliance
   * @returns Promise resolving to ComplianceBalance or null if not found
   */
  findComplianceBalance(
    shipId: string,
    year: Year
  ): Promise<ComplianceBalance | null>;
}

