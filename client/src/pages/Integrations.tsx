import Layout from "@/components/dashboard/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Github, Database, Zap, Globe, HardDrive, LayoutTemplate, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Integrations() {
  const services = [
    { 
      name: "GitHub", 
      icon: Github, 
      category: "Version Control", 
      status: "connected", 
      description: "Sync repositories and enable AI code reviews." 
    },
    { 
      name: "Notion", 
      icon: Database, 
      category: "Knowledge Base", 
      status: "connected", 
      description: "Access workspaces for documentation and task management." 
    },
    { 
      name: "Zapier", 
      icon: Zap, 
      category: "Automation", 
      status: "syncing", 
      description: "Trigger workflows across 5,000+ apps." 
    },
    { 
      name: "Perplexity", 
      icon: Globe, 
      category: "Research", 
      status: "connected", 
      description: "Real-time web search and citation generation." 
    },
    { 
      name: "Google Drive", 
      icon: CloudIcon, 
      category: "Storage", 
      status: "connected", 
      description: "Secure access to documents and assets." 
    },
    { 
      name: "Dropbox", 
      icon: HardDrive, 
      category: "Storage", 
      status: "connected", 
      description: "Backup and file sharing synchronization." 
    },
    { 
      name: "Stripe", 
      icon: LayoutTemplate, 
      category: "Payments", 
      status: "disconnected", 
      description: "Process payments and manage subscriptions." 
    },
  ];

  function CloudIcon(props: any) {
    return <HardDrive {...props} />; // Placeholder for Google Drive icon logic if needed
  }

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2 text-glow">Integration Hub</h1>
            <p className="text-muted-foreground">Manage connections to external services and data sources.</p>
          </div>
          <Button className="bg-white/10 hover:bg-white/20 text-white gap-2">
            <RefreshCw className="w-4 h-4" /> Refresh Status
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <div key={service.name} className="glass-panel p-6 rounded-2xl border-white/5 hover:border-primary/30 transition-all group relative overflow-hidden">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-xl bg-white/5 text-foreground group-hover:text-primary transition-colors">
                  <service.icon className="w-6 h-6" />
                </div>
                <Badge variant="outline" className={cn(
                  "capitalize border",
                  service.status === "connected" && "bg-green-500/10 text-green-500 border-green-500/20",
                  service.status === "syncing" && "bg-blue-500/10 text-blue-500 border-blue-500/20",
                  service.status === "disconnected" && "bg-red-500/10 text-red-500 border-red-500/20"
                )}>
                  {service.status === "syncing" && <RefreshCw className="w-3 h-3 mr-1 animate-spin" />}
                  {service.status}
                </Badge>
              </div>

              <div className="space-y-2 mb-6">
                <h3 className="font-bold text-lg">{service.name}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {service.description}
                </p>
              </div>

              <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{service.category}</span>
                <Button size="sm" variant={service.status === "disconnected" ? "default" : "outline"} className={cn(
                  service.status === "disconnected" && "bg-primary text-primary-foreground hover:bg-primary/90"
                )}>
                  {service.status === "disconnected" ? "Connect" : "Manage"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
