import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";

export async function checkBudget(req: Request, res: Response, next: NextFunction) {
  const orgId = req.session.orgId;
  
  if (!orgId) {
    return res.status(400).json({ error: "Organization not set" });
  }

  // Check daily budget
  const dailyBudget = await storage.getBudget(orgId, "daily");
  if (dailyBudget) {
    const spent = parseFloat(dailyBudget.spentUsd);
    const limit = parseFloat(dailyBudget.limitUsd);
    
    if (spent >= limit) {
      await storage.createAuditLog({
        orgId,
        userId: req.session.userId || null,
        action: "budget_exceeded",
        target: "daily_budget",
        detailJson: { spent, limit },
      });
      
      return res.status(402).json({
        error: "budget_exceeded",
        message: "Daily budget limit reached",
        spent,
        limit,
      });
    }
  }

  // Check monthly budget
  const monthlyBudget = await storage.getBudget(orgId, "monthly");
  if (monthlyBudget) {
    const spent = parseFloat(monthlyBudget.spentUsd);
    const limit = parseFloat(monthlyBudget.limitUsd);
    
    if (spent >= limit) {
      await storage.createAuditLog({
        orgId,
        userId: req.session.userId || null,
        action: "budget_exceeded",
        target: "monthly_budget",
        detailJson: { spent, limit },
      });
      
      return res.status(402).json({
        error: "budget_exceeded",
        message: "Monthly budget limit reached",
        spent,
        limit,
      });
    }
  }

  next();
}

export async function trackCost(orgId: string, costEstimate: string) {
  const dailyBudget = await storage.getBudget(orgId, "daily");
  if (dailyBudget) {
    await storage.updateBudgetSpent(dailyBudget.id, costEstimate);
  }

  const monthlyBudget = await storage.getBudget(orgId, "monthly");
  if (monthlyBudget) {
    await storage.updateBudgetSpent(monthlyBudget.id, costEstimate);
  }
}
