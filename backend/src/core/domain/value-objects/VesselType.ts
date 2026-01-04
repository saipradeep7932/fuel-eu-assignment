/**
 * Vessel type value object
 * Validates against known vessel types
 */
export enum VesselTypeEnum {
  CONTAINER = "Container",
  BULK_CARRIER = "BulkCarrier",
  TANKER = "Tanker",
  RORO = "RoRo",
}

export class VesselType {
  private constructor(private readonly value: VesselTypeEnum) {}

  static create(value: string): VesselType {
    const normalized = value.trim();
    const validType = Object.values(VesselTypeEnum).find(
      (type) => type === normalized
    );

    if (!validType) {
      throw new Error(
        `Invalid vessel type: ${value}. Valid types: ${Object.values(VesselTypeEnum).join(", ")}`
      );
    }

    return new VesselType(validType);
  }

  getValue(): VesselTypeEnum {
    return this.value;
  }

  equals(other: VesselType): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

