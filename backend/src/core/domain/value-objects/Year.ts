/**
 * Year value object
 * Validates year is within reasonable range (2000-2100)
 */
export class Year {
  private static readonly MIN_YEAR = 2000;
  private static readonly MAX_YEAR = 2100;

  private constructor(private readonly value: number) {
    if (!Number.isInteger(value)) {
      throw new Error("Year must be an integer");
    }

    if (value < Year.MIN_YEAR || value > Year.MAX_YEAR) {
      throw new Error(
        `Year must be between ${Year.MIN_YEAR} and ${Year.MAX_YEAR}`
      );
    }
  }

  static create(value: number): Year {
    return new Year(value);
  }

  getValue(): number {
    return this.value;
  }

  equals(other: Year): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value.toString();
  }
}

