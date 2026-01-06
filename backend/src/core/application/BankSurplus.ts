import { ComplianceBalance } from "../domain/value-objects/ComplianceBalance";
import { ComplianceRepository } from "../ports/ComplianceRepository";
import { Year } from "../domain/value-objects/Year";

/**
 * Use case: Bank Surplus
 * 
 * Banks a positive compliance balance surplus.
 * 
 * Responsibility:
 * - Validates that balance is a surplus (positive)
 * - Saves the banked surplus
 * 
 * This use case has side effects (persistence).
 */
export class BankSurplus {
  constructor(private readonly complianceRepository: ComplianceRepository) {}

  /**
   * Execute the use case
   * @param shipId Ship identifier
   * @param year Year
   * @param balance Compliance balance to bank (must be positive)
   * @throws Error if balance is not a surplus
   */
  async execute(
    shipId: string,
    year: Year,
    balance: ComplianceBalance
  ): Promise<void> {
    if (!balance.isSurplus()) {
      throw new Error("Can only bank positive compliance balance (surplus)");
    }

    await this.complianceRepository.saveBankEntry(shipId, year, balance);
  }
}

