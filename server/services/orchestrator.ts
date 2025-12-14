import { EventEmitter } from "events";
import { storage } from "../storage";
import { getProviderAdapter } from "./providerAdapters";
import { trackCost } from "../middleware/costGovernor";

export interface AgentHandoff {
  summary: string;
  decisions: string[];
  tasks: string[];
  artifacts: Array<{ name: string; content: string }>;
  questions: string[];
  nextAgentSuggestion?: string;
}

export interface AgentTask {
  runId: string;
  projectId: string;
  orgId: string;
  goal: string;
  mode: string;
}

class OrchestratorQueue extends EventEmitter {
  private queue: AgentTask[] = [];
  private processing = false;
  private concurrency = 2;
  private activeCount = 0;

  enqueue(task: AgentTask) {
    this.queue.push(task);
    this.emit("log", task.runId, { type: "info", message: "Task queued" });
    this.processQueue();
  }

  private async processQueue() {
    if (this.processing || this.activeCount >= this.concurrency) {
      return;
    }

    const task = this.queue.shift();
    if (!task) {
      return;
    }

    this.activeCount++;
    this.processing = true;

    try {
      await this.executeTask(task);
    } catch (error) {
      this.emit("log", task.runId, {
        type: "error",
        message: `Task failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
      
      await storage.updateAgentRun(task.runId, {
        status: "failed",
        outputJson: { error: error instanceof Error ? error.message : "Unknown error" },
      });
    } finally {
      this.activeCount--;
      this.processing = false;
      
      // Process next task if queue has items
      if (this.queue.length > 0) {
        setTimeout(() => this.processQueue(), 100);
      }
    }
  }

  private async executeTask(task: AgentTask) {
    const run = await storage.getAgentRun(task.runId);
    if (!run) {
      throw new Error("Agent run not found");
    }

    this.emit("log", task.runId, {
      type: "info",
      message: `Starting agent run with ${run.provider} (${run.model})`,
    });

    await storage.updateAgentRun(task.runId, { status: "running" });

    // Create initial message
    await storage.createMessage({
      projectId: task.projectId,
      agentRunId: task.runId,
      role: "user",
      content: task.goal,
    });

    // Get provider adapter
    const adapter = getProviderAdapter(run.provider);
    
    this.emit("log", task.runId, {
      type: "info",
      message: `Calling ${adapter.name} with model ${run.model}...`,
    });

    // Call the provider
    const response = await adapter.call(task.goal, run.model);

    if (!response.success) {
      throw new Error(response.error || "Provider call failed");
    }

    // Save the response
    await storage.createMessage({
      projectId: task.projectId,
      agentRunId: task.runId,
      role: "assistant",
      content: response.content || "",
    });

    // Update run with output and cost
    const costEstimate = response.usage?.costEstimate || "0";
    await storage.updateAgentRun(task.runId, {
      status: "completed",
      outputJson: {
        content: response.content,
        usage: response.usage,
      },
      costEstimate,
    });

    // Track cost in budget
    if (parseFloat(costEstimate) > 0) {
      await trackCost(task.orgId, costEstimate);
    }

    this.emit("log", task.runId, {
      type: "success",
      message: `Agent run completed. Cost: $${costEstimate}`,
    });

    // Audit log
    await storage.createAuditLog({
      orgId: task.orgId,
      userId: null,
      action: "agent_run_completed",
      target: task.runId,
      detailJson: { provider: run.provider, model: run.model, costEstimate },
    });
  }
}

export const orchestratorQueue = new OrchestratorQueue();
