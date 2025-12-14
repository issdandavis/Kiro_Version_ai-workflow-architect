import Layout from "@/components/dashboard/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Bot, Sparkles, Brain, MessageSquare, Play, Pause, Settings2 } from "lucide-react";
import { motion } from "framer-motion";

export default function Agents() {
  const agents = [
    { 
      name: "Claude 3.5 Sonnet", 
      role: "Code Architect", 
      status: "active", 
      icon: Brain,
      color: "text-orange-400",
      capabilities: ["System Design", "Refactoring", "Code Review"],
      load: 78
    },
    { 
      name: "GPT-4o", 
      role: "Documentation Lead", 
      status: "active", 
      icon: Sparkles,
      color: "text-green-400",
      capabilities: ["Technical Writing", "API Docs", "User Guides"],
      load: 45
    },
    { 
      name: "Grok Beta", 
      role: "Security Analyst", 
      status: "idle", 
      icon: MessageSquare,
      color: "text-purple-400",
      capabilities: ["Vulnerability Scan", "Optimization", "Fact Checking"],
      load: 12
    },
  ];

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2 text-glow">Agent Management</h1>
            <p className="text-muted-foreground">Configure and monitor your AI workforce.</p>
          </div>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
            <Bot className="w-4 h-4" /> Deploy New Agent
          </Button>
        </div>

        <div className="grid gap-6">
          {agents.map((agent, i) => (
            <motion.div 
              key={agent.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-panel p-6 rounded-2xl border-white/5 flex flex-col md:flex-row items-center gap-6"
            >
              <div className="flex-shrink-0">
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                  <agent.icon className={`w-8 h-8 ${agent.color}`} />
                </div>
              </div>

              <div className="flex-1 space-y-2 text-center md:text-left">
                <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4">
                  <h3 className="text-xl font-bold">{agent.name}</h3>
                  <Badge variant="outline" className={agent.status === "active" ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"}>
                    {agent.status}
                  </Badge>
                </div>
                <p className="text-muted-foreground">{agent.role}</p>
                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                  {agent.capabilities.map(cap => (
                    <span key={cap} className="text-xs px-2 py-1 rounded-full bg-white/5 border border-white/5 text-muted-foreground">
                      {cap}
                    </span>
                  ))}
                </div>
              </div>

              <div className="w-full md:w-48 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">System Load</span>
                  <span>{agent.load}%</span>
                </div>
                <Progress value={agent.load} className="h-2" />
              </div>

              <div className="flex gap-2">
                <Button size="icon" variant="ghost" className="hover:bg-white/10">
                  {agent.status === "active" ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                <Button size="icon" variant="ghost" className="hover:bg-white/10">
                  <Settings2 className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
