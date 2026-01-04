import { Request, Response } from "express";
import { RouteRepository } from "../../../core/ports/RouteRepository";
import { RouteId } from "../../../core/domain/value-objects/RouteId";

/**
 * Routes Controller (Inbound HTTP Adapter)
 * 
 * Handles HTTP requests for route operations.
 * 
 * Responsibility:
 * - Receives HTTP requests
 * - Validates HTTP input
 * - Delegates to application layer / repository
 * - Formats HTTP responses
 * - Handles HTTP errors
 * 
 * This is a thin controller with no business logic.
 */
export class RoutesController {
  constructor(private readonly routeRepository: RouteRepository) {}

  /**
   * GET /routes
   * Returns all routes
   */
  async getAllRoutes(_req: Request, res: Response): Promise<void> {
    try {
      const routes = await this.routeRepository.findAll();
      
      // Convert domain entities to DTOs for HTTP response
      const routeDTOs = routes.map((route) => ({
        routeId: route.getRouteId().getValue(),
        vesselType: route.getVesselType().getValue(),
        fuelType: route.getFuelType().getValue(),
        year: route.getYear().getValue(),
        ghgIntensity: route.getGHGIntensity().getValue(),
        fuelConsumption: route.getFuelConsumption().getValue(),
        distance: route.getDistance().getValue(),
        totalEmissions: route.getTotalEmissions().getValue(),
        isBaseline: route.getIsBaseline(),
      }));

      res.status(200).json(routeDTOs);
    } catch (error) {
      res.status(500).json({
        error: "Failed to fetch routes",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * POST /routes/:id/baseline
   * Sets a route as baseline for its year
   */
  async setBaseline(req: Request, res: Response): Promise<void> {
    try {
      const routeIdParam = req.params.id;

      if (!routeIdParam) {
        res.status(400).json({ error: "Route ID is required" });
        return;
      }

      const routeId = RouteId.create(routeIdParam);

      // Verify route exists
      const route = await this.routeRepository.findById(routeId);
      if (!route) {
        res.status(404).json({ error: "Route not found" });
        return;
      }

      // Set as baseline
      await this.routeRepository.setBaseline(routeId);

      res.status(200).json({
        message: "Route set as baseline successfully",
        routeId: routeId.getValue(),
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes("RouteId")) {
        res.status(400).json({
          error: "Invalid route ID",
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        error: "Failed to set baseline",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}

