import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Network, 
  Bot, 
  Settings, 
  Terminal, 
  Cpu,
  Zap,
  Github
} from "lucide-react";
import bgImage from "@assets/generated_images/dark_abstract_neural_network_background_for_ai_dashboard.png";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/" },
    { icon: Bot, label: "Agents", href: "/agents" },
    { icon: Network, label: "Integrations", href: "/integrations" },
    { icon: Terminal, label: "Logs", href: "/logs" },
    { icon: Settings, label: "Settings", href: "/settings" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20 selection:text-primary overflow-hidden flex">
      {/* Background Image Overlay */}
      <div 
        className="fixed inset-0 z-0 opacity-20 pointer-events-none mix-blend-screen"
        style={{
          backgroundImage: `url(${bgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      {/* Sidebar */}
      <aside className="w-20 lg:w-64 border-r border-border/40 glass-panel z-10 flex flex-col items-center lg:items-stretch py-6 backdrop-blur-xl">
        <div className="px-4 mb-10 flex items-center justify-center lg:justify-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/50 shadow-[0_0_15px_rgba(0,255,255,0.3)]">
            <Cpu className="w-6 h-6 text-primary" />
          </div>
          <span className="hidden lg:block font-bold text-xl tracking-tight">AI<span className="text-primary">.Core</span></span>
        </div>

        <nav className="flex-1 flex flex-col gap-2 px-2">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <a className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 group",
                  isActive 
                    ? "bg-primary/10 text-primary border border-primary/20 shadow-[0_0_10px_rgba(0,255,255,0.1)]" 
                    : "text-muted-foreground hover:bg-white/5 hover:text-white"
                )}>
                  <item.icon className={cn("w-5 h-5", isActive && "animate-pulse")} />
                  <span className="hidden lg:block font-medium">{item.label}</span>
                  {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_5px_currentColor] hidden lg:block" />}
                </a>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto px-4 py-4 border-t border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 ring-2 ring-white/10" />
            <div className="hidden lg:block">
              <div className="text-sm font-medium">Commander</div>
              <div className="text-xs text-muted-foreground">Online</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 z-10 overflow-y-auto h-screen relative">
        <div className="max-w-7xl mx-auto p-6 lg:p-10 space-y-8">
          {children}
        </div>
      </main>
    </div>
  );
}
