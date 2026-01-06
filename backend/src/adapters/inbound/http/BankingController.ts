import { Request, Response } from "express";
import { ComplianceRepository } from "../../../core/ports/ComplianceRepository";
import { RouteRepository } from "../../../core/ports/RouteRepository";
import { GetComplianceBalance } from "../../../core/application/GetComplianceBalance";
import { BankSurplus } from "../../../core/application/BankSurplus";
import { ApplyBanked } from "../../../core/application/ApplyBanked";
import { ComplianceBalance } from "../../../core/domain/value-objects/ComplianceBalance";
import { Year } from "../../../core/domain/value-objects/Year";
import { RouteId } from "../../../core/domain/value-objects/RouteId";

const UNIT_SCALE = 1000000; // 1 Tonne = 1,000,000 Grams

/**
 * Banking Controller (Inbound HTTP Adapter)
 * 
 * Handles HTTP requests for banking operations (Article 20).
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
export class BankingController {
  private readonly getComplianceBalanceUseCase: GetComplianceBalance;
  private readonly bankSurplus: BankSurplus;
  private readonly applyBanked: ApplyBanked;

  constructor(
    private readonly complianceRepository: ComplianceRepository,
    private readonly routeRepository: RouteRepository
  ) {
    this.getComplianceBalanceUseCase = new GetComplianceBalance(complianceRepository, routeRepository);
    this.bankSurplus = new BankSurplus(complianceRepository);
    this.applyBanked = new ApplyBanked(complianceRepository);
  }

  /**
   * GET /compliance/cb?shipId&year
   * Get compliance balance for a ship in a given year
   */
  async getComplianceBalance(req: Request, res: Response): Promise<void> {
    try {
      const shipId = req.query.shipId as string;
      const yearParam = req.query.year;

      if (!shipId) {
        res.status(400).json({ error: "shipId query parameter is required" });
        return;
      }

      if (!yearParam) {
        res.status(400).json({ error: "year query parameter is required" });
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

      const yearVO = Year.create(year);

      // Check if the route is a baseline route
      // Baseline ships do not have a computed compliance balance
      try {
        const routeId = RouteId.create(shipId);
        const route = await this.routeRepository.findById(routeId);

        if (route && route.getIsBaseline()) {
          res.status(400).json({
            error: "Invalid request",
            message: "Compliance balance is not defined for baseline ships",
          });
          return;
        }
      } catch (error) {
        // RouteId validation error - continue to check compliance balance
        // (compliance balance check will return 404 if not found)
      }

      const balance = await this.getComplianceBalanceUseCase.execute(shipId, yearVO);

      if (!balance) {
        res.status(404).json({
          error: "Compliance balance not found",
          message: `No compliance balance found for ship ${shipId} in year ${year}`,
        });
        return;
      }

      res.status(200).json({
        shipId,
        year,
        cb: balance.getValue() / UNIT_SCALE, // Convert Grams -> Tonnes
        isSurplus: balance.isSurplus(),
        isDeficit: balance.isDeficit(),
        isCompliant: balance.isCompliant(),
      });
    } catch (error) {
      res.status(500).json({
        error: "Failed to get compliance balance",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * GET /compliance/adjusted-cb?shipId&year
   * Get adjusted compliance balance (after bank applications) for a ship in a given year
   * This returns the CB after any banking adjustments have been applied
   */
  async getAdjustedComplianceBalance(req: Request, res: Response): Promise<void> {
    // Adjusted CB is the same as regular CB since we store the adjusted value after banking
    // This endpoint exists per spec requirement
    await this.getComplianceBalance(req, res);
  }

  /**
   * POST /banking/bank
   * Bank a positive compliance balance surplus
   * Body: { shipId, year, amount }
   */
  async bank(req: Request, res: Response): Promise<void> {
    try {
      const { shipId, year: yearParam, amount } = req.body;

      if (!shipId || typeof shipId !== "string") {
        res.status(400).json({ error: "shipId is required and must be a string" });
        return;
      }

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

      if (amount === undefined || !Number.isFinite(amount)) {
        res.status(400).json({
          error: "Invalid amount",
          message: "Amount must be a finite number",
        });
        return;
      }

      if (amount <= 0) {
        res.status(400).json({
          error: "Invalid amount",
          message: "Amount must be positive (surplus only)",
        });
        return;
      }

      const yearVO = Year.create(year);
      // Convert Tonnes -> Grams for Domain
      const balance = ComplianceBalance.create(amount * UNIT_SCALE);

      await this.bankSurplus.execute(shipId, yearVO, balance);

      res.status(200).json({
        message: "Surplus banked successfully",
        shipId,
        year,
        amount: balance.getValue() / UNIT_SCALE, // Return Tonnes
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes("Can only bank")) {
        res.status(400).json({
          error: "Invalid operation",
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        error: "Failed to bank surplus",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * POST /banking/apply
   * Apply banked surplus to a deficit
   * Body: { shipId, year, amount }
   */
  async apply(req: Request, res: Response): Promise<void> {
    try {
      const { shipId, year: yearParam, amount } = req.body;

      if (!shipId || typeof shipId !== "string") {
        res.status(400).json({ error: "shipId is required and must be a string" });
        return;
      }

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

      if (amount === undefined || !Number.isFinite(amount)) {
        res.status(400).json({
          error: "Invalid amount",
          message: "Amount must be a finite number",
        });
        return;
      }

      if (amount <= 0) {
        res.status(400).json({
          error: "Invalid amount",
          message: "Amount must be positive",
        });
        return;
      }

      const yearVO = Year.create(year);

      // Get current compliance balance
      const currentBalance = await this.getComplianceBalanceUseCase.execute(shipId, yearVO);

      if (!currentBalance) {
        res.status(404).json({
          error: "Compliance balance not found",
          message: `No compliance balance found for ship ${shipId} in year ${year}`,
        });
        return;
      }

      // Apply banked amount
      // Convert Tonnes -> Grams for Domain Logic
      const newBalance = await this.applyBanked.execute(
        shipId,
        yearVO,
        currentBalance,
        amount * UNIT_SCALE
      );

      res.status(200).json({
        message: "Banked surplus applied successfully",
        shipId,
        year,
        cbBefore: currentBalance.getValue() / UNIT_SCALE, // Return Tonnes
        applied: amount, // Already Tonnes from input
        cbAfter: newBalance.getValue() / UNIT_SCALE, // Return Tonnes
      });
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message.includes("Can only apply") ||
          error.message.includes("Cannot apply"))
      ) {
        res.status(400).json({
          error: "Invalid operation",
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        error: "Failed to apply banked surplus",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * GET /banking/records?shipId&year
   * Get banking records for a ship in a given year
   */
  async getBankingRecords(req: Request, res: Response): Promise<void> {
    try {
      const shipId = req.query.shipId as string;
      const yearParam = req.query.year;

      if (!shipId) {
        res.status(400).json({ error: "shipId query parameter is required" });
        return;
      }

      if (!yearParam) {
        res.status(400).json({ error: "year query parameter is required" });
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

      const yearVO = Year.create(year);
      const records = await this.complianceRepository.getBankingRecords(shipId, yearVO);

      if (records.length === 0) {
        res.status(404).json({
          error: "Banking records not found",
          message: `No banking records found for ship ${shipId} in year ${year}`,
        });
        return;
      }

      const totalBanked = records.reduce((sum, record) => sum + record.amount, 0);

      res.status(200).json({
        shipId,
        year,
        records: records.map((record) => ({
          amount: record.amount / UNIT_SCALE, // Return Tonnes
          createdAt: record.createdAt.toISOString(),
        })),
        totalBanked: totalBanked / UNIT_SCALE, // Return Tonnes
      });
    } catch (error) {
      res.status(500).json({
        error: "Failed to get banking records",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}

