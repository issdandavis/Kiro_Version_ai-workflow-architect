/**
 * Dashboard Page v2.0
 * 
 * Main command center for AI workflow orchestration.
 * Features real-time stats, agent cards, and workflow visualization.
 * 
 * @version 2.0.0
 * @component Dashboard
 */

import Layout from "@/components/dashboard/Layout";
import AgentCard from "@/components/dashboard/AgentCard";
import ActivityFeed from "@/components/dashboard/ActivityFeed";
import CommandInput from "@/components/dashboard/CommandInput";
import IntegrationStatus from "@/components/dashboard/IntegrationStatus";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Zap, Users, DollarSign, MessageSquare, Plus, ArrowRight, Bot, Code } from "lucide-react";
import { Link } from "wouter";

interface DashboardStats {
  usage: {
    totalTokens: number;
    totalCostUsd: number;
    periodDays: number;
  };
  integrations: {
    total: number;
    connected: number;
  };
  roundtables: {
    total: number;
    active: number;
  };
}

function formatTokens(tokens: number): string {
  if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
  if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`;
  return tokens.toString();
}

function formatCost(cost: number): string {
  return `$${cost.toFixed(2)}`;
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  interface Workflow {
    id: string;
    name: string;
    status: "active" | "paused" | "draft";
    steps: { id: string; provider: string; prompt: string }[];
  }

  const { data: workflows = [] } = useQuery<Workflow[]>({
    queryKey: ["/api/workflows"],
  });

  // Dynamic agent configuration based on available providers
  const agents = [
    { name: "Claude 3.5", role: "Code Architect", status: "idle" as const, icon: "claude" as const, tasksCompleted: stats?.roundtables?.total || 0 },
    { name: "ChatGPT-4o", role: "Documentation Lead", status: "idle" as const, icon: "gpt" as const, tasksCompleted: 0 },
    { name: "Grok Beta", role: "Research Analyst", status: "idle" as const, icon: "grok" as const, tasksCompleted: 0 },
    { name: "Gemini Pro", role: "Multi-Modal Expert", status: "idle" as const, icon: "gemini" as const, tasksCompleted: 0 },
  ];

  const statCards = [
    {
      label: "Tokens Used",
      value: stats ? formatTokens(stats.usage.totalTokens) : "0",
      sublabel: "Last 30 days",
      icon: Zap,
      color: "text-cyan-400",
    },
    {
      label: "AI Spend",
      value: stats ? formatCost(stats.usage.totalCostUsd) : "$0.00",
      sublabel: "Last 30 days",
      icon: DollarSign,
      color: "text-green-400",
    },
    {
      label: "Integrations",
      value: stats ? `${stats.integrations.connected}/${stats.integrations.total}` : "0/0",
      sublabel: "Connected",
      icon: Users,
      color: "text-purple-400",
    },
    {
      label: "Roundtables",
      value: stats ? stats.roundtables.total.toString() : "0",
      sublabel: `${stats?.roundtables?.active || 0} active`,
      icon: MessageSquare,
      color: "text-orange-400",
    },
  ];

  return (
    <Layout>
      <div className="space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2 text-glow" data-testid="dashboard-title">Command Deck</h1>
            <p className="text-muted-foreground">Universal AI orchestration platform v2.0 - Orchestrate. Automate. Self-Improve.</p>
          </div>
          <div className="flex gap-2">
            <Link href="/autonomy">
              <div className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-mono flex items-center gap-2 cursor-pointer hover:bg-purple-500/20 transition-colors">
                <Bot className="w-3 h-3" />
                AUTONOMY
              </div>
            </Link>
            <Link href="/developer">
              <div className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono flex items-center gap-2 cursor-pointer hover:bg-cyan-500/20 transition-colors">
                <Code className="w-3 h-3" />
                DEV MODE
              </div>
            </Link>
            <div className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono flex items-center gap-2" data-testid="system-status">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              SYSTEM OPTIMAL
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-testid="stats-grid">
          {statCards.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card p-4 rounded-xl"
              data-testid={`stat-card-${stat.label.toLowerCase().replace(/\s/g, "-")}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
              <div className="text-2xl font-bold">{statsLoading ? "..." : stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.sublabel}</div>
            </motion.div>
          ))}
        </div>

        {/* Integration Status Bar */}
        <IntegrationStatus />

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
          
          {/* Left Column: Agents */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {agents.map((agent, i) => (
                <motion.div
                  key={agent.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <AgentCard {...agent} />
                </motion.div>
              ))}
            </div>

            <Link href="/workflows" className="block">
              <div className="glass-panel p-6 rounded-2xl min-h-[300px] cursor-pointer hover:border-primary/50 transition-colors" data-testid="active-workflows-section">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="w-1 h-6 bg-primary rounded-full" />
                  Active Workflows
                  <ArrowRight className="w-4 h-4 ml-auto text-muted-foreground" />
                </h2>
                <div className="relative h-48 border border-white/10 rounded-xl bg-black/20 overflow-hidden flex items-center justify-center">
                   <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px]" />
                   
                   {workflows.length === 0 ? (
                     <div className="flex flex-col items-center gap-4 relative z-10 text-center">
                       <div className="rounded-full bg-primary/10 p-4">
                         <Plus className="w-8 h-8 text-primary" />
                       </div>
                       <div>
                         <p className="text-muted-foreground">No workflows yet.</p>
                         <p className="text-primary text-sm">Create one!</p>
                       </div>
                     </div>
                   ) : (
                     <div className="flex items-center gap-4 relative z-10 px-4">
                       {workflows.slice(0, 3).map((workflow, index) => (
                         <div key={workflow.id} className="flex items-center gap-4">
                           <div className={`p-4 rounded-xl bg-card border ${workflow.status === 'active' ? 'border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.2)]' : workflow.status === 'paused' ? 'border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.2)]' : 'border-gray-500/50'} flex flex-col items-center gap-2 min-w-[80px]`}>
                             <div className={`w-8 h-8 rounded-full ${workflow.status === 'active' ? 'bg-green-500' : workflow.status === 'paused' ? 'bg-yellow-500' : 'bg-gray-500'} text-white flex items-center justify-center font-bold text-sm`}>
                               {workflow.name.charAt(0).toUpperCase()}
                             </div>
                             <span className="text-xs font-mono truncate max-w-[70px]">{workflow.name}</span>
                           </div>
                           {index < Math.min(workflows.length - 1, 2) && (
                             <div className="h-[2px] w-8 bg-gradient-to-r from-primary/50 to-purple-500/50 animate-pulse relative">
                               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full shadow-[0_0_10px_white]" />
                             </div>
                           )}
                         </div>
                       ))}
                       {workflows.length > 3 && (
                         <div className="text-xs text-muted-foreground">+{workflows.length - 3} more</div>
                       )}
                     </div>
                   )}
                </div>
              </div>
            </Link>
          </div>

          {/* Right Column: Feed & Input */}
          <div className="space-y-6 flex flex-col">
            <ActivityFeed />
            <div className="mt-auto">
              <CommandInput />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
