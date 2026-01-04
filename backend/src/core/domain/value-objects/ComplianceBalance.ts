/**
 * Compliance Balance (CB) value object (tonnes CO₂e)
 * Represents the difference between target and actual emissions
 * Positive = Surplus, Negative = Deficit
 * 
 * Formula: CB = (Target Intensity - Actual Intensity) × Energy in Scope
 */
export class ComplianceBalance {
  private constructor(private readonly value: number) {
    if (!Number.isFinite(value)) {
      throw new Error("Compliance balance must be a finite number");
    }
  }

  /**
   * Calculate compliance balance from target and actual intensity
   * Formula: CB = (Target - Actual) × Energy in scope
   * @param targetIntensity Target GHG intensity (gCO₂e/MJ)
   * @param actualIntensity Actual GHG intensity (gCO₂e/MJ)
   * @param energyInScope Energy in scope (MJ)
   * @returns ComplianceBalance instance
   */
  static calculate(
    targetIntensity: number,
    actualIntensity: number,
    energyInScope: number
  ): ComplianceBalance {
    if (!Number.isFinite(targetIntensity) || !Number.isFinite(actualIntensity) || !Number.isFinite(energyInScope)) {
      throw new Error("All parameters must be finite numbers");
    }

    const cb = (targetIntensity - actualIntensity) * energyInScope;
    return new ComplianceBalance(cb);
  }

  /**
   * Create ComplianceBalance from a direct value
   * @param value Compliance balance value (tonnes CO₂e)
   * @returns ComplianceBalance instance
   */
  static create(value: number): ComplianceBalance {
    return new ComplianceBalance(value);
  }

  /**
   * Get the compliance balance value
   * @returns Compliance balance in tonnes CO₂e
   */
  getValue(): number {
    return this.value;
  }

  /**
   * Check if this is a surplus (positive CB)
   * @returns true if CB > 0
   */
  isSurplus(): boolean {
    return this.value > 0;
  }

  /**
   * Check if this is a deficit (negative CB)
   * @returns true if CB < 0
   */
  isDeficit(): boolean {
    return this.value < 0;
  }

  /**
   * Check if compliant (zero or positive CB)
   * @returns true if CB ≥ 0
   */
  isCompliant(): boolean {
    return this.value >= 0;
  }

  /**
   * Check if an amount can be applied to this compliance balance
   * For deficits: amount can be applied if positive
   * For surpluses: cannot apply (already positive)
   * @param amount Amount to apply (must be positive)
   * @returns true if amount can be applied
   */
  canApply(amount: number): boolean {
    if (amount <= 0) {
      return false;
    }

    if (!Number.isFinite(amount)) {
      return false;
    }

    // Can only apply to deficits
    if (this.isSurplus()) {
      return false;
    }

    // For deficits, any positive amount can be applied
    return true;
  }

  /**
   * Apply an amount to this compliance balance
   * Adds the amount to the current CB (reduces deficit or increases surplus)
   * @param amount Amount to apply (must be positive)
   * @returns New ComplianceBalance instance with amount applied
   * @throws Error if amount cannot be applied
   */
  apply(amount: number): ComplianceBalance {
    if (!this.canApply(amount)) {
      throw new Error(`Cannot apply amount ${amount} to compliance balance ${this.value}`);
    }

    return new ComplianceBalance(this.value + amount);
  }

  /**
   * Add another compliance balance to this one
   * @param other Other ComplianceBalance to add
   * @returns New ComplianceBalance instance
   */
  add(other: ComplianceBalance): ComplianceBalance {
    return new ComplianceBalance(this.value + other.value);
  }

  /**
   * Subtract another compliance balance from this one
   * @param other Other ComplianceBalance to subtract
   * @returns New ComplianceBalance instance
   */
  subtract(other: ComplianceBalance): ComplianceBalance {
    return new ComplianceBalance(this.value - other.value);
  }

  equals(other: ComplianceBalance): boolean {
    return Math.abs(this.value - other.value) < Number.EPSILON;
  }

  toString(): string {
    return this.value.toFixed(4);
  }
}

