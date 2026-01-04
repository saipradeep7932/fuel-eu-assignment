import { Router } from "express";
import { RoutesController } from "../../adapters/inbound/http/RoutesController";
import { ComparisonController } from "../../adapters/inbound/http/ComparisonController";
import { BankingController } from "../../adapters/inbound/http/BankingController";
import { PoolingController } from "../../adapters/inbound/http/PoolingController";
import { RouteRepository } from "../../core/ports/RouteRepository";
import { ComplianceRepository } from "../../core/ports/ComplianceRepository";

/**
 * Setup Express routes
 * Wires controllers to Express router with dependency injection
 */
export function setupRoutes(
  routeRepository: RouteRepository,
  complianceRepository: ComplianceRepository
): Router {
  const router = Router();

  // Initialize controllers with dependencies
  const routesController = new RoutesController(routeRepository);
  const comparisonController = new ComparisonController(routeRepository);
  const bankingController = new BankingController(complianceRepository);
  const poolingController = new PoolingController(complianceRepository);

  // Routes endpoints
  router.get("/routes", (req, res) => routesController.getAllRoutes(req, res));
  router.post("/routes/:id/baseline", (req, res) => routesController.setBaseline(req, res));

  // Comparison endpoints
  router.get("/routes/comparison", (req, res) => comparisonController.compareRoutes(req, res));

  // Compliance endpoints
  router.get("/compliance/cb", (req, res) => bankingController.getComplianceBalance(req, res));
  router.get("/compliance/adjusted-cb", (req, res) => bankingController.getAdjustedComplianceBalance(req, res));

  // Banking endpoints
  router.post("/banking/bank", (req, res) => bankingController.bank(req, res));
  router.post("/banking/apply", (req, res) => bankingController.apply(req, res));

  // Pooling endpoints
  router.post("/pools", (req, res) => poolingController.createPool(req, res));

  return router;
}

