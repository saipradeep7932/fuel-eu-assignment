/**
 * Fuel type value object
 * Validates against known fuel types
 */
export enum FuelTypeEnum {
  HFO = "HFO", // Heavy Fuel Oil
  LNG = "LNG", // Liquefied Natural Gas
  MGO = "MGO", // Marine Gas Oil
}

export class FuelType {
  private constructor(private readonly value: FuelTypeEnum) {}

  static create(value: string): FuelType {
    const normalized = value.trim().toUpperCase();
    const validType = Object.values(FuelTypeEnum).find(
      (type) => type === normalized
    );

    if (!validType) {
      throw new Error(
        `Invalid fuel type: ${value}. Valid types: ${Object.values(FuelTypeEnum).join(", ")}`
      );
    }

    return new FuelType(validType);
  }

  getValue(): FuelTypeEnum {
    return this.value;
  }

  equals(other: FuelType): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

