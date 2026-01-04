/**
 * Distance value object (kilometers)
 * Validates distance is positive
 */
export class Distance {
  private constructor(private readonly value: number) {
    if (value <= 0) {
      throw new Error("Distance must be positive");
    }

    if (!Number.isFinite(value)) {
      throw new Error("Distance must be a finite number");
    }
  }

  static create(value: number): Distance {
    return new Distance(value);
  }

  getValue(): number {
    return this.value;
  }

  equals(other: Distance): boolean {
    return Math.abs(this.value - other.value) < Number.EPSILON;
  }

  toString(): string {
    return this.value.toFixed(2);
  }
}

