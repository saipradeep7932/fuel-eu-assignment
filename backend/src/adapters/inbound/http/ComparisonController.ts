import { Request, Response } from "express";
import { RouteRepository } from "../../../core/ports/RouteRepository";
import { CompareRoutes } from "../../../core/application/CompareRoutes";
import { TARGET_GHG_INTENSITY } from "../../../core/domain/constants";
import { Year } from "../../../core/domain/value-objects/Year";

/**
 * Comparison Controller (Inbound HTTP Adapter)
 * 
 * Handles HTTP requests for route comparison operations.
 * 
 * Responsibility:
 * - Receives HTTP requests
 * - Validates HTTP input
 * - Delegates to application layer use-cases
 * - Formats HTTP responses
 * - Handles HTTP errors
 * 
 * This is a thin controller with no business logic.
 */
export class ComparisonController {
  private readonly compareRoutesUseCase: CompareRoutes;

  constructor(private readonly routeRepository: RouteRepository) {
    this.compareRoutesUseCase = new CompareRoutes();
  }

  /**
   * GET /routes/comparison
   * Compares baseline route with all other routes
   * 
   * Query params (optional):
   * - year: Filter by year
   * - targetIntensity: Override target intensity (default: 89.3368)
   */
  async compareRoutes(req: Request, res: Response): Promise<void> {
    try {
      const targetIntensity =
        req.query.targetIntensity !== undefined
          ? Number(req.query.targetIntensity)
          : TARGET_GHG_INTENSITY;

      if (!Number.isFinite(targetIntensity) || targetIntensity < 0) {
        res.status(400).json({
          error: "Invalid target intensity",
          message: "Target intensity must be a positive number",
        });
        return;
      }

      // Get all routes
      const allRoutes = await this.routeRepository.findAll();

      if (allRoutes.length === 0) {
        res.status(200).json({ comparisons: [] });
        return;
      }

      // Find baseline route
      // If year filter is provided, find baseline for that year
      // Otherwise, find the first baseline route
      let baselineRoute = null;
      if (req.query.year) {
        const year = Number(req.query.year);
        if (!Number.isInteger(year)) {
          res.status(400).json({
            error: "Invalid year",
            message: "Year must be an integer",
          });
          return;
        }
        baselineRoute = await this.routeRepository.findBaseline(Year.create(year));
      } else {
        baselineRoute = allRoutes.find((route) => route.getIsBaseline());
      }

      if (!baselineRoute) {
        res.status(404).json({
          error: "Baseline route not found",
          message: "No baseline route exists. Set a baseline route first.",
        });
        return;
      }

      // Compare all routes with baseline
      const comparisons = [];
      for (const route of allRoutes) {
        // Skip comparing baseline with itself
        if (route.getRouteId().equals(baselineRoute.getRouteId())) {
          continue;
        }

        try {
          const comparison = this.compareRoutesUseCase.execute(
            baselineRoute,
            route,
            targetIntensity
          );

          comparisons.push({
            routeId: route.getRouteId().getValue(),
            vesselType: route.getVesselType().getValue(),
            fuelType: route.getFuelType().getValue(),
            year: route.getYear().getValue(),
            ...comparison,
          });
        } catch (error) {
          // Skip routes that cannot be compared (different year/vessel type)
          // Log but continue with other routes
          if (error instanceof Error && error.message.includes("cannot be compared")) {
            continue;
          }
          throw error;
        }
      }

      res.status(200).json({
        baseline: {
          routeId: baselineRoute.getRouteId().getValue(),
          year: baselineRoute.getYear().getValue(),
          vesselType: baselineRoute.getVesselType().getValue(),
          intensity: baselineRoute.getGHGIntensity().getValue(),
        },
        comparisons,
        targetIntensity,
      });
    } catch (error) {
      res.status(500).json({
        error: "Failed to compare routes",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}

