/**
 * Fuel consumption value object (tonnes)
 * Validates consumption is positive
 */
export class FuelConsumption {
  private constructor(private readonly value: number) {
    if (value <= 0) {
      throw new Error("Fuel consumption must be positive");
    }

    if (!Number.isFinite(value)) {
      throw new Error("Fuel consumption must be a finite number");
    }
  }

  static create(value: number): FuelConsumption {
    return new FuelConsumption(value);
  }

  getValue(): number {
    return this.value;
  }

  /**
   * Convert fuel consumption to energy in scope (MJ)
   * Formula: fuelConsumption × conversionFactor MJ/t
   * @param conversionFactor Energy conversion factor (default: 41000 MJ/t)
   * @returns Energy in scope in MJ
   */
  toEnergyInScope(conversionFactor: number = 41000): number {
    return this.value * conversionFactor;
  }

  equals(other: FuelConsumption): boolean {
    return Math.abs(this.value - other.value) < Number.EPSILON;
  }

  toString(): string {
    return this.value.toFixed(2);
  }
}

