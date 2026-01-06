import { ComplianceBalance } from "../domain/value-objects/ComplianceBalance";
import { ComplianceRepository } from "../ports/ComplianceRepository";
import { Year } from "../domain/value-objects/Year";

/**
 * Use case: Apply Banked Surplus
 * 
 * Applies a banked surplus to a deficit compliance balance.
 * 
 * Responsibility:
 * - Validates that current balance is a deficit
 * - Validates that amount can be applied
 * - Calculates new balance and saves it
 * 
 * This use case has side effects (persistence).
 */
export class ApplyBanked {
  constructor(private readonly complianceRepository: ComplianceRepository) { }

  /**
   * Execute the use case
   * @param shipId Ship identifier
   * @param year Year
   * @param currentBalance Current compliance balance (must be deficit)
   * @param amount Amount to apply (must be positive)
   * @returns New ComplianceBalance after application
   * @throws Error if balance is not a deficit or amount cannot be applied
   */
  async execute(
    shipId: string,
    year: Year,
    currentBalance: ComplianceBalance,
    amount: number
  ): Promise<ComplianceBalance> {
    if (!currentBalance.isDeficit()) {
      throw new Error("Can only apply banked surplus to deficit compliance balance");
    }

    if (!currentBalance.canApply(amount)) {
      throw new Error(`Cannot apply amount ${amount} to compliance balance ${currentBalance.getValue()}`);
    }

    // 1. Calculate total banked surplus
    const totalBanked = await this.complianceRepository.getTotalBanked(shipId);

    if (amount > totalBanked) {
      throw new Error(
        `Insufficient banked surplus. Available: ${totalBanked}, Requested: ${amount}`
      );
    }

    // 2. Apply to compliance balance
    const newBalance = currentBalance.apply(amount);
    await this.complianceRepository.saveComplianceBalance(shipId, year, newBalance);

    // 3. Deduct from bank (store negative entry)
    // We use the year of application to trace usage
    await this.complianceRepository.saveBankEntry(
      shipId,
      year,
      ComplianceBalance.create(-amount)
    );

    return newBalance;
  }
}

