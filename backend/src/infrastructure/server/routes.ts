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
  router.get("/routes", (req, res, next) => {
    routesController.getAllRoutes(req, res).catch(next);
  });
  router.post("/routes/:id/baseline", (req, res, next) => {
    routesController.setBaseline(req, res).catch(next);
  });

  // Comparison endpoints
  router.get("/routes/comparison", (req, res, next) => {
    comparisonController.compareRoutes(req, res).catch(next);
  });

  // Compliance endpoints
  router.get("/compliance/cb", (req, res, next) => {
    bankingController.getComplianceBalance(req, res).catch(next);
  });
  router.get("/compliance/adjusted-cb", (req, res, next) => {
    bankingController.getAdjustedComplianceBalance(req, res).catch(next);
  });

  // Banking endpoints
  router.post("/banking/bank", (req, res, next) => {
    bankingController.bank(req, res).catch(next);
  });
  router.post("/banking/apply", (req, res, next) => {
    bankingController.apply(req, res).catch(next);
  });

  // Pooling endpoints
  router.post("/pools", (req, res, next) => {
    poolingController.createPool(req, res).catch(next);
  });

  return router;
}

