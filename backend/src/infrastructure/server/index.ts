import express from "express";
import cors from "cors";
import { setupRoutes } from "./routes";
import { PostgresRouteRepository } from "../../adapters/outbound/db/PostgresRouteRepository";
import { PostgresComplianceRepository } from "../../adapters/outbound/db/PostgresComplianceRepository";
import { getPool } from "../db/pgClient";

const app = express();

app.use(cors());

// JSON body parsing: only for POST, PUT, PATCH, DELETE
// GET requests should never have a body and should not trigger JSON parsing
app.use(express.json({
  // Only parse JSON for these HTTP methods
  // GET requests are excluded - they should not have a body
  skip: (req) => {
    return req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS';
  }
}));

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Initialize database connection
const db = getPool();

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
