import { Pool } from "pg";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

/**
 * PostgreSQL connection pool
 * Singleton instance for database connections
 */
let pool: Pool | null = null;

/**
 * Get or create PostgreSQL connection pool
 * @returns Pool instance
 */
export function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error(
        "DATABASE_URL environment variable is required. " +
        "Example: postgresql://user:password@localhost:5432/fueleu"
      );
    }

    pool = new Pool({
      connectionString,
      // Connection pool settings
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
    });

    // Handle pool errors
    pool.on("error", (err) => {
      console.error("Unexpected error on idle client", err);
    });
  }

  return pool;
}

/**
 * Close the connection pool
 * Useful for graceful shutdown
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

