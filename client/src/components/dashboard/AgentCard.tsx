import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Bot, Sparkles, Brain, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";

interface AgentCardProps {
  name: string;
  role: string;
  status: "idle" | "thinking" | "executing" | "offline";
  icon: "claude" | "gpt" | "grok" | "generic";
  tasksCompleted: number;
}

export default function AgentCard({ name, role, status, icon, tasksCompleted }: AgentCardProps) {
  const getIcon = () => {
    switch (icon) {
      case "claude": return <Brain className="w-6 h-6 text-orange-400" />;
      case "gpt": return <Sparkles className="w-6 h-6 text-green-400" />;
      case "grok": return <MessageSquare className="w-6 h-6 text-white" />;
      default: return <Bot className="w-6 h-6 text-primary" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "idle": return "bg-yellow-500/20 text-yellow-500 border-yellow-500/30";
      case "thinking": return "bg-blue-500/20 text-blue-500 border-blue-500/30";
      case "executing": return "bg-primary/20 text-primary border-primary/30";
      case "offline": return "bg-red-500/20 text-red-500 border-red-500/30";
    }
  };

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="glass-card rounded-2xl p-6 relative overflow-hidden group"
    >
      <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
        {getIcon()}
      </div>
      
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 rounded-xl bg-white/5 border border-white/10 shadow-inner">
          {getIcon()}
        </div>
        <Badge variant="outline" className={cn("capitalize border", getStatusColor())}>
          <span className={cn("w-1.5 h-1.5 rounded-full mr-2 animate-pulse", 
            status === "executing" ? "bg-primary" : 
            status === "thinking" ? "bg-blue-500" :
            status === "idle" ? "bg-yellow-500" : "bg-red-500"
          )} />
          {status}
        </Badge>
      </div>

      <div className="space-y-1 mb-6">
        <h3 className="font-bold text-lg tracking-tight">{name}</h3>
        <p className="text-sm text-muted-foreground">{role}</p>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t border-white/5">
        <span>Tasks Completed</span>
        <span className="font-mono text-foreground font-bold">{tasksCompleted}</span>
      </div>

      {status === "executing" && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50 animate-pulse" />
      )}
    </motion.div>
  );
}
