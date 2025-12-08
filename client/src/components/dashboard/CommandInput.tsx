import { Button } from "@/components/ui/button";
import { Send, Mic, Paperclip } from "lucide-react";

export default function CommandInput() {
  return (
    <div className="glass-panel rounded-2xl p-2 flex items-center gap-2">
      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
        <Paperclip className="w-5 h-5" />
      </Button>
      
      <input 
        type="text" 
        placeholder="Command your AI team (e.g., 'Update the Notion roadmap based on recent GitHub commits')..."
        className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground/50 px-2 font-medium"
      />
      
      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
        <Mic className="w-5 h-5" />
      </Button>
      
      <Button size="icon" className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_rgba(0,255,255,0.4)] transition-all hover:scale-105">
        <Send className="w-5 h-5" />
      </Button>
    </div>
  );
}
