import { Pool, PoolClient } from "pg";
import { ComplianceRepository } from "../../../core/ports/ComplianceRepository";
import { ComplianceBalance } from "../../../core/domain/value-objects/ComplianceBalance";
import { Year } from "../../../core/domain/value-objects/Year";

/**
 * Database row structure for ship_compliance table
 * Note: NUMERIC columns are returned as strings by node-postgres (pg)
 */
interface ComplianceRow {
  id: number;
  ship_id: string;
  year: number | string; // INTEGER may come as number
  cb_gco2eq: string | number; // NUMERIC type returned as string
}

/**
 * Database row structure for bank_entries table
 * Note: NUMERIC columns are returned as strings by node-postgres (pg)
 */
interface BankEntryRow {
  id: number;
  ship_id: string;
  year: number | string; // INTEGER may come as number
  amount_gco2eq: string | number; // NUMERIC type returned as string
  created_at: Date | string; // TIMESTAMP
}

/**
 * PostgreSQL implementation of ComplianceRepository
 * 
 * Maps database rows to ComplianceBalance value objects and vice versa.
 * Handles only persistence logic, no business logic.
 */
export class PostgresComplianceRepository implements ComplianceRepository {
  constructor(private readonly db: Pool | PoolClient) { }

  /**
   * Save compliance balance for a ship in a given year
   */
  async saveComplianceBalance(
    shipId: string,
    year: Year,
    balance: ComplianceBalance
  ): Promise<void> {
    const yearValue = year.getValue();
    const balanceValue = balance.getValue();

    // Check if record exists
    const existing = await this.db.query<ComplianceRow>(
      "SELECT id FROM ship_compliance WHERE ship_id = $1 AND year = $2",
      [shipId, yearValue]
    );

    if (existing.rows.length > 0) {
      // Update existing record
      await this.db.query(
        "UPDATE ship_compliance SET cb_gco2eq = $1 WHERE ship_id = $2 AND year = $3",
        [balanceValue, shipId, yearValue]
      );
    } else {
      // Insert new record
      await this.db.query(
        "INSERT INTO ship_compliance (ship_id, year, cb_gco2eq) VALUES ($1, $2, $3)",
        [shipId, yearValue, balanceValue]
      );
    }
  }

  /**
   * Find compliance balance for a ship in a given year
   */
  async findComplianceBalance(
    shipId: string,
    year: Year
  ): Promise<ComplianceBalance | null> {
    const result = await this.db.query<ComplianceRow>(
      "SELECT * FROM ship_compliance WHERE ship_id = $1 AND year = $2",
      [shipId, year.getValue()]
    );

    if (result.rows.length === 0) {
      return null;
    }

    // PostgreSQL NUMERIC is returned as string, must convert to number
    return ComplianceBalance.create(Number(result.rows[0].cb_gco2eq));
  }

  /**
   * Get banking records for a ship in a given year
   * Returns records ordered by created_at ASC
   */
  async getBankingRecords(
    shipId: string,
    year: Year
  ): Promise<Array<{ amount: number; createdAt: Date }>> {
    const result = await this.db.query<BankEntryRow>(
      "SELECT amount_gco2eq, created_at FROM bank_entries WHERE ship_id = $1 AND year = $2 ORDER BY created_at ASC",
      [shipId, year.getValue()]
    );

    return result.rows.map((row) => ({
      amount: Number(row.amount_gco2eq), // PostgreSQL NUMERIC is returned as string, must convert to number
      createdAt: row.created_at instanceof Date ? row.created_at : new Date(row.created_at),
    }));
  }

  /**
   * Get total banked surplus for a ship
   * Sums up all entries in bank_entries for the ship
   */
  async getTotalBanked(shipId: string): Promise<number> {
    const result = await this.db.query<{ total: string | number | null }>(
      "SELECT SUM(amount_gco2eq) as total FROM bank_entries WHERE ship_id = $1",
      [shipId]
    );

    if (result.rows.length === 0 || result.rows[0].total === null) {
      return 0;
    }

    return Number(result.rows[0].total);
  }

  /**
   * Save a banked entry (surplus banking operation)
   * Inserts into bank_entries table
   */
  async saveBankEntry(
    shipId: string,
    year: Year,
    amount: ComplianceBalance
  ): Promise<void> {
    const yearValue = year.getValue();
    const amountValue = amount.getValue();

    const result = await this.db.query(
      "INSERT INTO bank_entries (ship_id, year, amount_gco2eq) VALUES ($1, $2, $3)",
      [shipId, yearValue, amountValue]
    );

    if (result.rowCount === 0) {
      throw new Error("Failed to insert bank entry");
    }
  }
}

