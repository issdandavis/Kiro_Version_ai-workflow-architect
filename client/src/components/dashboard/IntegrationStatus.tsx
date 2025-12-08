import { Github, Database, Zap, Globe, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface IntegrationProps {
  name: string;
  icon: React.ElementType;
  status: "connected" | "disconnected" | "syncing";
  lastSync: string;
}

export default function IntegrationStatus() {
  const integrations: IntegrationProps[] = [
    { name: "GitHub", icon: Github, status: "connected", lastSync: "2m ago" },
    { name: "Notion", icon: Database, status: "connected", lastSync: "15m ago" },
    { name: "Zapier", icon: Zap, status: "syncing", lastSync: "Now" },
    { name: "Perplexity", icon: Globe, status: "connected", lastSync: "1h ago" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {integrations.map((item) => (
        <div key={item.name} className="glass-card p-4 rounded-xl flex items-center justify-between group cursor-pointer border-white/5 hover:border-primary/30">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg bg-white/5 text-muted-foreground group-hover:text-primary transition-colors",
              item.status === "syncing" && "animate-pulse bg-primary/10 text-primary"
            )}>
              <item.icon className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold text-sm">{item.name}</div>
              <div className="text-xs text-muted-foreground">{item.lastSync}</div>
            </div>
          </div>
          
          <div className={cn(
            "w-2 h-2 rounded-full",
            item.status === "connected" && "bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]",
            item.status === "syncing" && "bg-blue-500 animate-ping",
            item.status === "disconnected" && "bg-red-500"
          )} />
        </div>
      ))}
    </div>
  );
}
