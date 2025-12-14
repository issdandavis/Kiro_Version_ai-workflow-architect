import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Zap, Lock, Globe, Brain, Code2 } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import bgImage from "@assets/generated_images/clean_modern_ecommerce_storefront_background.png";

export default function PublicHome() {
  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-purple-500/30">
      {/* Navigation Overlay */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between backdrop-blur-md border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight" data-testid="text-brand">AI Orchestration Hub</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/shop">
            <span className="text-sm font-medium hover:text-purple-400 transition-colors cursor-pointer" data-testid="link-pricing">Pricing</span>
          </Link>
          <Link href="/login">
            <span className="text-sm font-medium hover:text-purple-400 transition-colors flex items-center gap-2 cursor-pointer" data-testid="link-login">
              <Lock className="w-3 h-3" />
              Login
            </span>
          </Link>
          <Link href="/shop">
            <Button className="bg-white text-black hover:bg-white/90 rounded-full px-6" data-testid="button-get-started">
              Get Started
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 z-0 opacity-40"
          style={{
            backgroundImage: `url(${bgImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-black z-0" />
        
        <div className="relative z-10 max-w-4xl mx-auto text-center px-6 space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/50" data-testid="text-hero-title">
              Multi-AI Orchestration Platform
            </h1>
            <p className="text-xl text-white/60 max-w-2xl mx-auto leading-relaxed" data-testid="text-hero-subtitle">
              Coordinate Claude, GPT, Grok & Perplexity in one hub. Connect Google Drive, OneDrive, Notion, Stripe & more.
            </p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/shop">
              <Button size="lg" className="h-14 px-8 rounded-full bg-purple-600 hover:bg-purple-500 text-lg shadow-[0_0_20px_rgba(147,51,234,0.4)] transition-all hover:scale-105" data-testid="button-view-pricing">
                View Pricing <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="lg" variant="outline" className="h-14 px-8 rounded-full border-white/20 hover:bg-white/10 text-lg backdrop-blur-sm" data-testid="button-try-free">
                Try Free
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6 bg-black relative">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-purple-500/50 transition-colors group" data-testid="card-feature-ai">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center mb-6 text-purple-400 group-hover:scale-110 transition-transform">
              <Brain className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold mb-3">Multi-AI Power</h3>
            <p className="text-white/50 leading-relaxed">Orchestrate Claude, GPT-4, Grok, and Perplexity from one dashboard. AI Roundtable discussions for complex decisions.</p>
          </div>
          
          <div className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-blue-500/50 transition-colors group" data-testid="card-feature-integrations">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center mb-6 text-blue-400 group-hover:scale-110 transition-transform">
              <Globe className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold mb-3">6+ Integrations</h3>
            <p className="text-white/50 leading-relaxed">Google Drive, OneDrive, Notion, Stripe, GitHub, and World Anvil. Manage files, docs, and payments in one place.</p>
          </div>

          <div className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-green-500/50 transition-colors group" data-testid="card-feature-code">
            <div className="w-12 h-12 rounded-2xl bg-green-500/20 flex items-center justify-center mb-6 text-green-400 group-hover:scale-110 transition-transform">
              <Code2 className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold mb-3">Code Studio</h3>
            <p className="text-white/50 leading-relaxed">Monaco editor with AI-powered code generation. Web search capability via Perplexity for real-time answers.</p>
          </div>
        </div>
      </section>

      {/* Pricing CTA */}
      <section className="py-24 px-6 bg-gradient-to-b from-black to-purple-950/20 relative">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6" data-testid="text-cta-title">Simple Pricing, No Surprises</h2>
          <p className="text-xl text-white/60 mb-8">$49 lifetime access or $9/month. Cancel anytime.</p>
          <Link href="/shop">
            <Button size="lg" className="h-14 px-10 rounded-full bg-purple-600 hover:bg-purple-500 text-lg" data-testid="button-cta-pricing">
              See Pricing Plans <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
