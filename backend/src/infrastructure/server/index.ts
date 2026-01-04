import express from "express";
import cors from "cors";
import { setupRoutes } from "./routes";
import { PostgresRouteRepository } from "../../adapters/outbound/db/PostgresRouteRepository";
import { PostgresComplianceRepository } from "../../adapters/outbound/db/PostgresComplianceRepository";
import { Pool } from "pg";

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Initialize database connection
// TODO: Replace with actual connection string from environment
const db = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://localhost:5432/fueleu",
});

// Initialize repositories
const routeRepository = new PostgresRouteRepository(db);
const complianceRepository = new PostgresComplianceRepository(db);

// Setup routes
const apiRouter = setupRoutes(routeRepository, complianceRepository);
app.use("/api", apiRouter);

// Root routes (for backward compatibility)
app.use("/", apiRouter);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`API routes: http://localhost:${PORT}/api/routes`);
});
