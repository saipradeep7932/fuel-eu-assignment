/**
 * GHG Intensity value object (gCO₂e/MJ)
 * Validates intensity is non-negative
 */
export class GHGIntensity {
  private constructor(private readonly value: number) {
    if (value < 0) {
      throw new Error("GHG intensity cannot be negative");
    }

    if (!Number.isFinite(value)) {
      throw new Error("GHG intensity must be a finite number");
    }
  }

  static create(value: number): GHGIntensity {
    return new GHGIntensity(value);
  }

  getValue(): number {
    return this.value;
  }

  /**
   * Check if this intensity is compliant with the target
   * @param targetIntensity Target GHG intensity (gCO₂e/MJ)
   * @returns true if this intensity is less than or equal to target
   */
  isCompliant(targetIntensity: number): boolean {
    return this.value <= targetIntensity;
  }

  /**
   * Calculate percentage difference from baseline
   * Formula: ((comparison / baseline) - 1) × 100
   * @param baseline Baseline GHG intensity value object
   * @returns Percentage difference as a number
   * @throws Error if baseline is zero
   */
  percentDifferenceFrom(baseline: GHGIntensity): number {
    if (baseline.getValue() === 0) {
      throw new Error("Cannot calculate percentage difference from zero baseline");
    }
    return ((this.value / baseline.getValue()) - 1) * 100;
  }

  equals(other: GHGIntensity): boolean {
    return Math.abs(this.value - other.value) < Number.EPSILON;
  }

  toString(): string {
    return this.value.toFixed(2);
  }
}

