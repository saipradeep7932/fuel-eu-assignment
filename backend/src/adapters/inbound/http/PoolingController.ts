import { Request, Response } from "express";
import { ComplianceRepository } from "../../../core/ports/ComplianceRepository";
import { CreatePool } from "../../../core/application/CreatePool";
import { ComplianceBalance } from "../../../core/domain/value-objects/ComplianceBalance";
import { Year } from "../../../core/domain/value-objects/Year";

/**
 * Pooling Controller (Inbound HTTP Adapter)
 * 
 * Handles HTTP requests for pooling operations (Article 21).
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
export class PoolingController {
  private readonly createPool: CreatePool;

  constructor(private readonly complianceRepository: ComplianceRepository) {
    this.createPool = new CreatePool(complianceRepository);
  }

  /**
   * POST /pools
   * Create a compliance pool
   * Body: { year, members: [{ shipId, cbBefore }] }
   */
  async createPool(req: Request, res: Response): Promise<void> {
    try {
      const { year: yearParam, members } = req.body;

      if (yearParam === undefined) {
        res.status(400).json({ error: "year is required" });
        return;
      }

      const year = Number(yearParam);
      if (!Number.isInteger(year)) {
        res.status(400).json({
          error: "Invalid year",
          message: "Year must be an integer",
        });
        return;
      }

      // Validate year range
      const MIN_YEAR = 2000;
      const MAX_YEAR = 2100;
      if (year < MIN_YEAR || year > MAX_YEAR) {
        res.status(400).json({
          error: "Invalid year",
          message: `Year must be between ${MIN_YEAR} and ${MAX_YEAR}`,
        });
        return;
      }

      if (!Array.isArray(members) || members.length === 0) {
        res.status(400).json({
          error: "Invalid members",
          message: "members must be a non-empty array",
        });
        return;
      }

      // Validate and convert members
      const poolMembers = [];
      for (const member of members) {
        if (!member.shipId || typeof member.shipId !== "string") {
          res.status(400).json({
            error: "Invalid member",
            message: "Each member must have a shipId (string)",
          });
          return;
        }

        if (member.cbBefore === undefined || !Number.isFinite(member.cbBefore)) {
          res.status(400).json({
            error: "Invalid member",
            message: "Each member must have cbBefore (number)",
          });
          return;
        }

        poolMembers.push({
          shipId: member.shipId,
          cbBefore: ComplianceBalance.create(member.cbBefore),
        });
      }

      const yearVO = Year.create(year);
      const result = await this.createPool.execute(yearVO, poolMembers);

      res.status(200).json({
        message: "Pool created successfully",
        year,
        poolSum: result.poolSum,
        valid: result.valid,
        members: result.members.map((member) => ({
          shipId: member.shipId,
          cbBefore: member.cbBefore.getValue(),
          cbAfter: member.cbAfter.getValue(),
        })),
      });
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message.includes("Pool sum") ||
          error.message.includes("cannot exit") ||
          error.message.includes("must have"))
      ) {
        res.status(400).json({
          error: "Invalid pool",
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        error: "Failed to create pool",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}

