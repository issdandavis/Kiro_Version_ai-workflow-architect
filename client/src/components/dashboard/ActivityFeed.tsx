import { ScrollArea } from "@/components/ui/scroll-area";
import { Terminal, CheckCircle2, AlertCircle, Clock, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogEntry {
  id: string;
  timestamp: string;
  agent: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
}

const logs: LogEntry[] = [
  { id: "1", timestamp: "10:42:05", agent: "Claude", message: "Analyzing repository structure...", type: "info" },
  { id: "2", timestamp: "10:42:08", agent: "Claude", message: "Identified 3 potential optimization points in /server/routes.ts", type: "success" },
  { id: "3", timestamp: "10:42:15", agent: "System", message: "GitHub API rate limit approaching (85%)", type: "warning" },
  { id: "4", timestamp: "10:42:20", agent: "ChatGPT", message: "Generating unit tests for AuthController", type: "info" },
  { id: "5", timestamp: "10:42:25", agent: "Zapier", message: "Notion page updated: 'Sprint Planning'", type: "success" },
  { id: "6", timestamp: "10:42:28", agent: "Grok", message: "Fetching latest documentation for Drizzle ORM", type: "info" },
];

export default function ActivityFeed() {
  return (
    <div className="glass-panel rounded-2xl flex flex-col h-[400px]">
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm">Live Activity Feed</h3>
        </div>
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/50" />
        </div>
      </div>
      
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4 font-mono text-sm">
          {logs.map((log) => (
            <div key={log.id} className="flex gap-3 group">
              <div className="w-16 text-xs text-muted-foreground pt-0.5">{log.timestamp}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn(
                    "text-xs font-bold px-1.5 py-0.5 rounded",
                    log.type === "info" && "bg-blue-500/10 text-blue-400",
                    log.type === "success" && "bg-green-500/10 text-green-400",
                    log.type === "warning" && "bg-yellow-500/10 text-yellow-400",
                    log.type === "error" && "bg-red-500/10 text-red-400",
                  )}>
                    {log.agent}
                  </span>
                  {log.type === "success" && <CheckCircle2 className="w-3 h-3 text-green-500" />}
                  {log.type === "warning" && <AlertCircle className="w-3 h-3 text-yellow-500" />}
                </div>
                <p className="text-muted-foreground group-hover:text-foreground transition-colors leading-relaxed">
                  {log.type === "info" && <span className="text-primary mr-2">{">"}</span>}
                  {log.message}
                </p>
              </div>
            </div>
          ))}
          <div className="h-4 w-2 bg-primary animate-pulse" />
        </div>
      </ScrollArea>
    </div>
  );
}
