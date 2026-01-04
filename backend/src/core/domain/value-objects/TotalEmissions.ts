/**
 * Total emissions value object (tonnes CO₂e)
 * Validates emissions are non-negative
 */
export class TotalEmissions {
  private constructor(private readonly value: number) {
    if (value < 0) {
      throw new Error("Total emissions cannot be negative");
    }

    if (!Number.isFinite(value)) {
      throw new Error("Total emissions must be a finite number");
    }
  }

  static create(value: number): TotalEmissions {
    return new TotalEmissions(value);
  }

  getValue(): number {
    return this.value;
  }

  equals(other: TotalEmissions): boolean {
    return Math.abs(this.value - other.value) < Number.EPSILON;
  }

  toString(): string {
    return this.value.toFixed(2);
  }
}

