import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Cpu, ArrowRight, Github } from "lucide-react";
import { Link } from "wouter";
import bgImage from "@assets/generated_images/secure_futuristic_authentication_portal_background.png";

export default function Signup() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex items-center justify-center relative overflow-hidden">
      {/* Background */}
      <div 
        className="absolute inset-0 z-0 opacity-40 pointer-events-none"
        style={{
          backgroundImage: `url(${bgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-0" />

      {/* Signup Card */}
      <div className="relative z-10 w-full max-w-md p-8 glass-panel rounded-3xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-xl">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/50 shadow-[0_0_20px_rgba(0,255,255,0.4)] mb-4">
            <Cpu className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-glow">Request Clearance</h1>
          <p className="text-muted-foreground">Join the AI Orchestration Network.</p>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>First Name</Label>
              <Input placeholder="John" className="bg-black/40 border-white/10" />
            </div>
            <div className="space-y-2">
              <Label>Last Name</Label>
              <Input placeholder="Doe" className="bg-black/40 border-white/10" />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" placeholder="commander@aicore.com" className="bg-black/40 border-white/10" />
          </div>
          <div className="space-y-2">
            <Label>Password</Label>
            <Input type="password" placeholder="••••••••" className="bg-black/40 border-white/10" />
          </div>

          <Button className="w-full h-10 bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_rgba(0,255,255,0.3)]">
            Create Account
          </Button>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Already authorized? <Link href="/login"><a className="text-primary hover:underline">Access Terminal</a></Link>
          </p>
        </div>
      </div>
    </div>
  );
}
