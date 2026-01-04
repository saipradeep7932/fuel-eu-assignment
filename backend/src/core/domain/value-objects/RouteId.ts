/**
 * Route ID value object
 * Ensures route identifiers are non-empty strings
 */
export class RouteId {
  private constructor(private readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error("RouteId cannot be empty");
    }
  }

  static create(value: string): RouteId {
    return new RouteId(value);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: RouteId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

