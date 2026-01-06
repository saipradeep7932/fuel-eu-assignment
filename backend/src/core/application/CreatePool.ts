import { ComplianceBalance } from "../domain/value-objects/ComplianceBalance";
import { ComplianceRepository } from "../ports/ComplianceRepository";
import { Year } from "../domain/value-objects/Year";

/**
 * Pool member with before/after compliance balance
 */
export interface PoolMember {
  shipId: string;
  cbBefore: ComplianceBalance;
  cbAfter: ComplianceBalance;
}

/**
 * Pool creation result
 */
export interface PoolResult {
  members: PoolMember[];
  poolSum: number;
  valid: boolean;
}

/**
 * Use case: Create Pool
 * 
 * Creates a compliance pool by redistributing compliance balances among ships.
 * 
 * Rules:
 * - Sum(adjusted CB) ≥ 0 (pool must be valid)
 * - Deficit ship cannot exit worse (cbAfter ≥ cbBefore for deficits)
 * - Surplus ship cannot exit negative (cbAfter ≥ 0 for surpluses)
 * 
 * Uses greedy allocation: sort by CB descending, transfer surplus to deficits.
 * 
 * This use case has side effects (persistence).
 */
export class CreatePool {
  constructor(private readonly complianceRepository: ComplianceRepository) { }

  /**
   * Execute the use case
   * @param year Year
   * @param members Array of {shipId, cbBefore} for pool members
   * @returns PoolResult with members and validation status
   * @throws Error if pool rules are violated
   */
  async execute(
    year: Year,
    members: Array<{ shipId: string; cbBefore: ComplianceBalance }>
  ): Promise<PoolResult> {
    if (members.length === 0) {
      throw new Error("Pool must have at least one member");
    }

    // Calculate total pool sum
    const poolSum = members.reduce(
      (sum, member) => sum + member.cbBefore.getValue(),
      0
    );

    // Validate: Sum must be ≥ 0
    if (poolSum < 0) {
      throw new Error(`Pool sum is negative: ${poolSum}. Pool must have sum ≥ 0`);
    }

    // Greedy allocation: sort by CB descending (surpluses first, then deficits)
    const sortedMembers = [...members].sort(
      (a, b) => b.cbBefore.getValue() - a.cbBefore.getValue()
    );

    const allocations: PoolMember[] = [];

    // 1. Calculate total deficit that needs to be covered
    let totalDeficitToCover = 0;
    const surplusMembers = [];
    const deficitAndNeutralMembers = [];

    for (const member of sortedMembers) {
      const val = member.cbBefore.getValue();
      if (val < 0) {
        totalDeficitToCover += Math.abs(val);
        deficitAndNeutralMembers.push(member);
      } else if (val === 0) {
        deficitAndNeutralMembers.push(member);
      } else {
        surplusMembers.push(member);
      }
    }

    // 2. Process Deficits and Neutrals
    // Since we validated poolSum >= 0, we can always cover all deficits
    for (const member of deficitAndNeutralMembers) {
      allocations.push({
        shipId: member.shipId,
        cbBefore: member.cbBefore,
        cbAfter: ComplianceBalance.create(0) // Deficits cleared, Neutrals stay 0
      });
    }

    // 3. Deduct from Surplus members (Greedy: highest surplus pays first)
    for (const member of surplusMembers) {
      const currentSurplus = member.cbBefore.getValue();

      if (totalDeficitToCover > 0) {
        // Deduct from this ship
        const contribution = Math.min(currentSurplus, totalDeficitToCover);
        const remaining = currentSurplus - contribution;

        allocations.push({
          shipId: member.shipId,
          cbBefore: member.cbBefore,
          cbAfter: ComplianceBalance.create(remaining)
        });

        totalDeficitToCover -= contribution;
      } else {
        // No more deficit to cover, keep full surplus
        allocations.push({
          shipId: member.shipId,
          cbBefore: member.cbBefore,
          cbAfter: member.cbBefore
        });
      }
    }

    // Validate rules after allocation
    for (const allocation of allocations) {
      const cbBefore = allocation.cbBefore.getValue();
      const cbAfter = allocation.cbAfter.getValue();

      // Rule: Deficit ship cannot exit worse
      if (cbBefore < 0 && cbAfter < cbBefore) {
        throw new Error(
          `Deficit ship ${allocation.shipId} cannot exit worse: ${cbBefore} → ${cbAfter}`
        );
      }

      // Rule: Surplus ship cannot exit negative
      if (cbBefore > 0 && cbAfter < 0) {
        throw new Error(
          `Surplus ship ${allocation.shipId} cannot exit negative: ${cbBefore} → ${cbAfter}`
        );
      }
    }

    // Persist all allocations
    for (const allocation of allocations) {
      await this.complianceRepository.saveComplianceBalance(
        allocation.shipId,
        year,
        allocation.cbAfter
      );
    }

    return {
      members: allocations,
      poolSum,
      valid: true,
    };
  }
}

