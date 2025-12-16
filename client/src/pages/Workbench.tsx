import { useState, useRef, useEffect } from "react";
import Layout from "@/components/dashboard/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  MessageCircle,
  Send,
  Loader2,
  Play,
  Pause,
  Square,
  RefreshCw,
  Sparkles,
  Users,
  ChevronDown,
  ChevronUp,
  Settings,
  Zap,
  Brain,
  CheckCircle2,
  AlertCircle,
  Clock,
  Target,
  Layers,
  Merge,
  Split,
  Copy,
  Plus,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

interface PanelMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  tokensUsed?: number;
  provider?: string;
}

interface AIPanel {
  id: string;
  provider: string;
  model: string;
  name: string;
  status: "idle" | "thinking" | "error" | "complete";
  messages: PanelMessage[];
  color: string;
  task?: string;
  progress: number;
  tokensTotal: number;
}

interface CollaborationSession {
  id: string;
  mainGoal: string;
  mode: "consensus" | "expert" | "debate" | "synthesis";
  status: "active" | "paused" | "completed";
  panels: AIPanel[];
  synthesizedOutput?: string;
  actionItems: string[];
}

const PROVIDER_CONFIG: Record<string, { name: string; color: string; models: string[] }> = {
  anthropic: {
    name: "Claude",
    color: "orange",
    models: ["claude-sonnet-4-20250514", "claude-3-haiku-20240307"],
  },
  openai: {
    name: "GPT",
    color: "emerald",
    models: ["gpt-4o", "gpt-4o-mini"],
  },
  google: {
    name: "Gemini",
    color: "cyan",
    models: ["gemini-2.0-flash", "gemini-1.5-pro"],
  },
  perplexity: {
    name: "Perplexity",
    color: "blue",
    models: ["sonar", "sonar-pro"],
  },
  xai: {
    name: "Grok",
    color: "purple",
    models: ["grok-2", "grok-2-mini"],
  },
  groq: {
    name: "Groq",
    color: "rose",
    models: ["llama3-8b-8192", "mixtral-8x7b-32768"],
  },
};

const COLLABORATION_MODES = {
  consensus: {
    name: "Consensus",
    description: "All agents work toward agreement",
    icon: Users,
  },
  expert: {
    name: "Expert Panel",
    description: "Each agent provides specialized expertise",
    icon: Brain,
  },
  debate: {
    name: "Debate",
    description: "Agents argue different perspectives",
    icon: Zap,
  },
  synthesis: {
    name: "Synthesis",
    description: "Combine insights into unified output",
    icon: Merge,
  },
};

function getProviderColor(provider: string) {
  const colors: Record<string, { bg: string; text: string; border: string }> = {
    orange: { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/30" },
    emerald: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30" },
    cyan: { bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/30" },
    blue: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/30" },
    purple: { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/30" },
    rose: { bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/30" },
  };
  return colors[provider] || colors.blue;
}

function ChatPanel({
  panel,
  onSendMessage,
  onUpdateTask,
  isMinimized,
  onToggleMinimize,
}: {
  panel: AIPanel;
  onSendMessage: (panelId: string, message: string) => void;
  onUpdateTask: (panelId: string, task: string) => void;
  isMinimized: boolean;
  onToggleMinimize: () => void;
}) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const colors = getProviderColor(panel.color);
  const config = PROVIDER_CONFIG[panel.provider];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [panel.messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSendMessage(panel.id, input.trim());
    setInput("");
  };

  return (
    <div className={`flex flex-col h-full rounded-xl border ${colors.border} ${colors.bg} overflow-hidden`}>
      <div
        className={`flex items-center justify-between p-3 border-b ${colors.border} cursor-pointer`}
        onClick={onToggleMinimize}
      >
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            panel.status === "thinking" ? "bg-yellow-400 animate-pulse" :
            panel.status === "complete" ? "bg-green-400" :
            panel.status === "error" ? "bg-red-400" :
            "bg-gray-400"
          }`} />
          <span className={`font-semibold ${colors.text}`} data-testid={`panel-name-${panel.id}`}>
            {config?.name || panel.provider}
          </span>
          <Badge variant="outline" className="text-xs">
            {panel.model}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{panel.tokensTotal} tokens</span>
          {isMinimized ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </div>
      </div>

      <AnimatePresence>
        {!isMinimized && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="flex flex-col flex-1 overflow-hidden"
          >
            {panel.task && (
              <div className="p-2 border-b border-white/5 bg-black/20">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Target className="w-3 h-3" />
                  <span className="truncate">{panel.task}</span>
                </div>
                <div className="mt-1 h-1 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${colors.text.replace("text", "bg")} transition-all`}
                    style={{ width: `${panel.progress}%` }}
                  />
                </div>
              </div>
            )}

            <ScrollArea className="flex-1 p-3" ref={scrollRef}>
              <div className="space-y-3">
                {panel.messages.map((msg, idx) => (
                  <div
                    key={msg.id || idx}
                    className={`p-2 rounded-lg text-sm ${
                      msg.role === "user"
                        ? "bg-white/10 ml-4"
                        : msg.role === "system"
                        ? "bg-yellow-500/10 text-yellow-300 italic"
                        : `${colors.bg} mr-4`
                    }`}
                    data-testid={`message-${panel.id}-${idx}`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    {msg.tokensUsed && (
                      <span className="text-xs text-muted-foreground mt-1 block">
                        {msg.tokensUsed} tokens
                      </span>
                    )}
                  </div>
                ))}

                {panel.status === "thinking" && (
                  <div className={`p-2 rounded-lg ${colors.bg} mr-4 flex items-center gap-2`}>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Thinking...</span>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="p-2 border-t border-white/5">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Send message to this agent..."
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                  className="bg-black/20 border-white/10"
                  data-testid={`input-${panel.id}`}
                />
                <Button
                  size="icon"
                  onClick={handleSend}
                  disabled={!input.trim() || panel.status === "thinking"}
                  data-testid={`send-${panel.id}`}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SynthesisPanel({
  session,
  panels,
  onRunSynthesis,
  isLoading,
}: {
  session: CollaborationSession | null;
  panels: AIPanel[];
  onRunSynthesis: () => void;
  isLoading: boolean;
}) {
  if (!session) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <Layers className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Start a collaboration session to see synthesis</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Merge className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Unified Thread</h3>
        </div>
        <Button
          size="sm"
          onClick={onRunSynthesis}
          disabled={isLoading}
          data-testid="button-synthesize"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Sparkles className="w-4 h-4 mr-2" />
          )}
          Synthesize
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {session.mainGoal && (
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-primary" />
                <span className="font-medium">Main Goal</span>
              </div>
              <p className="text-sm">{session.mainGoal}</p>
            </div>
          )}

          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4" /> Agent Contributions
            </h4>
            {panels.map((panel) => {
              const colors = getProviderColor(panel.color);
              const lastMessage = panel.messages.filter(m => m.role === "assistant").pop();
              return (
                <div
                  key={panel.id}
                  className={`p-3 rounded-lg border ${colors.border} ${colors.bg}`}
                  data-testid={`contribution-${panel.id}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`font-medium text-sm ${colors.text}`}>
                      {PROVIDER_CONFIG[panel.provider]?.name || panel.provider}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {panel.status}
                    </Badge>
                  </div>
                  {lastMessage ? (
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {lastMessage.content}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No response yet</p>
                  )}
                </div>
              );
            })}
          </div>

          {session.synthesizedOutput && (
            <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-purple-500/10 border border-primary/30">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-primary" />
                <span className="font-semibold">Synthesized Output</span>
              </div>
              <p className="text-sm whitespace-pre-wrap">{session.synthesizedOutput}</p>
            </div>
          )}

          {session.actionItems.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Action Items
              </h4>
              <ul className="space-y-1">
                {session.actionItems.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 p-2 rounded bg-white/5 text-sm"
                    data-testid={`action-item-${idx}`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function AddPanelDialog({
  onAdd,
  existingProviders,
}: {
  onAdd: (provider: string, model: string) => void;
  existingProviders: string[];
}) {
  const [open, setOpen] = useState(false);
  const [provider, setProvider] = useState("");
  const [model, setModel] = useState("");

  const availableProviders = Object.entries(PROVIDER_CONFIG).filter(
    ([key]) => !existingProviders.includes(key)
  );

  const handleAdd = () => {
    if (provider && model) {
      onAdd(provider, model);
      setOpen(false);
      setProvider("");
      setModel("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2" data-testid="button-add-panel">
          <Plus className="w-4 h-4" /> Add AI Panel
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add AI Panel</DialogTitle>
          <DialogDescription>
            Add another AI agent to the workbench
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Provider</label>
            <Select value={provider} onValueChange={(v) => { setProvider(v); setModel(""); }}>
              <SelectTrigger data-testid="select-add-provider">
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent>
                {availableProviders.map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {provider && (
            <div>
              <label className="text-sm font-medium">Model</label>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger data-testid="select-add-model">
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {PROVIDER_CONFIG[provider]?.models.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <Button
            onClick={handleAdd}
            disabled={!provider || !model}
            className="w-full"
            data-testid="button-confirm-add"
          >
            Add Panel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Workbench() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [session, setSession] = useState<CollaborationSession | null>(null);
  const [mainGoal, setMainGoal] = useState("");
  const [mode, setMode] = useState<"consensus" | "expert" | "debate" | "synthesis">("synthesis");
  const [minimizedPanels, setMinimizedPanels] = useState<Set<string>>(new Set());
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  const defaultPanels: AIPanel[] = [
    {
      id: "panel-1",
      provider: "anthropic",
      model: "claude-sonnet-4-20250514",
      name: "Claude",
      status: "idle",
      messages: [],
      color: "orange",
      progress: 0,
      tokensTotal: 0,
    },
    {
      id: "panel-2",
      provider: "openai",
      model: "gpt-4o",
      name: "GPT",
      status: "idle",
      messages: [],
      color: "emerald",
      progress: 0,
      tokensTotal: 0,
    },
    {
      id: "panel-3",
      provider: "google",
      model: "gemini-2.0-flash",
      name: "Gemini",
      status: "idle",
      messages: [],
      color: "cyan",
      progress: 0,
      tokensTotal: 0,
    },
  ];

  const [panels, setPanels] = useState<AIPanel[]>(defaultPanels);

  const sendToPanelMutation = useMutation({
    mutationFn: async ({ panelId, message }: { panelId: string; message: string }) => {
      const panel = panels.find((p) => p.id === panelId);
      if (!panel) throw new Error("Panel not found");

      const res = await apiRequest("POST", "/api/workbench/chat", {
        provider: panel.provider,
        model: panel.model,
        message,
        context: session?.mainGoal || "",
        mode: session?.mode || mode,
      });
      return res.json();
    },
    onMutate: ({ panelId, message }) => {
      setPanels((prev) =>
        prev.map((p) =>
          p.id === panelId
            ? {
                ...p,
                status: "thinking" as const,
                messages: [
                  ...p.messages,
                  {
                    id: `user-${Date.now()}`,
                    role: "user" as const,
                    content: message,
                    timestamp: new Date(),
                  },
                ],
              }
            : p
        )
      );
    },
    onSuccess: (data, { panelId }) => {
      setPanels((prev) =>
        prev.map((p) =>
          p.id === panelId
            ? {
                ...p,
                status: "complete" as const,
                progress: 100,
                tokensTotal: p.tokensTotal + (data.tokensUsed || 0),
                messages: [
                  ...p.messages,
                  {
                    id: `assistant-${Date.now()}`,
                    role: "assistant" as const,
                    content: data.content,
                    timestamp: new Date(),
                    tokensUsed: data.tokensUsed,
                    provider: data.provider,
                  },
                ],
              }
            : p
        )
      );
    },
    onError: (error, { panelId }) => {
      setPanels((prev) =>
        prev.map((p) =>
          p.id === panelId
            ? {
                ...p,
                status: "error" as const,
                messages: [
                  ...p.messages,
                  {
                    id: `error-${Date.now()}`,
                    role: "system" as const,
                    content: `Error: ${error.message}`,
                    timestamp: new Date(),
                  },
                ],
              }
            : p
        )
      );
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const startCollaboration = () => {
    if (!mainGoal.trim()) {
      toast({ title: "Error", description: "Please enter a main goal", variant: "destructive" });
      return;
    }

    const newSession: CollaborationSession = {
      id: `session-${Date.now()}`,
      mainGoal: mainGoal.trim(),
      mode,
      status: "active",
      panels,
      actionItems: [],
    };

    setSession(newSession);

    panels.forEach((panel) => {
      const taskPrompt = getModePrompt(mode, mainGoal.trim(), panel.provider);
      setPanels((prev) =>
        prev.map((p) =>
          p.id === panel.id ? { ...p, task: taskPrompt, progress: 0 } : p
        )
      );
      sendToPanelMutation.mutate({ panelId: panel.id, message: taskPrompt });
    });

    toast({ title: "Session started", description: `${panels.length} agents are working on your goal` });
  };

  const getModePrompt = (mode: string, goal: string, provider: string): string => {
    const prompts: Record<string, string> = {
      consensus: `You are participating in a consensus-building discussion. The main goal is: "${goal}". Please provide your perspective and work toward finding common ground with other AI participants. Be constructive and solution-oriented.`,
      expert: `You are serving as an expert panel member with unique expertise. The main goal is: "${goal}". Provide your specialized insights, considering your model's particular strengths. Focus on areas where you can add the most value.`,
      debate: `You are participating in a structured debate. The main goal is: "${goal}". Present strong arguments for your position, consider counterarguments, and engage critically with the topic. Be respectful but rigorous.`,
      synthesis: `You are contributing to a synthesis exercise. The main goal is: "${goal}". Provide your analysis and insights that can be combined with other perspectives to create a comprehensive solution. Be clear and structured in your response.`,
    };
    return prompts[mode] || prompts.synthesis;
  };

  const runSynthesis = async () => {
    if (!session) return;

    setIsSynthesizing(true);

    try {
      const contributions = panels
        .map((p) => {
          const lastMsg = p.messages.filter((m) => m.role === "assistant").pop();
          return lastMsg ? `${PROVIDER_CONFIG[p.provider]?.name || p.provider}: ${lastMsg.content}` : null;
        })
        .filter(Boolean)
        .join("\n\n---\n\n");

      const res = await apiRequest("POST", "/api/workbench/synthesize", {
        goal: session.mainGoal,
        mode: session.mode,
        contributions,
      });

      const data = await res.json();

      setSession((prev) =>
        prev
          ? {
              ...prev,
              synthesizedOutput: data.synthesis,
              actionItems: data.actionItems || [],
            }
          : null
      );

      toast({ title: "Synthesis complete", description: "Unified output generated" });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Synthesis failed",
        variant: "destructive",
      });
    } finally {
      setIsSynthesizing(false);
    }
  };

  const addPanel = (provider: string, model: string) => {
    const config = PROVIDER_CONFIG[provider];
    const newPanel: AIPanel = {
      id: `panel-${Date.now()}`,
      provider,
      model,
      name: config?.name || provider,
      status: "idle",
      messages: [],
      color: config?.color || "blue",
      progress: 0,
      tokensTotal: 0,
    };
    setPanels((prev) => [...prev, newPanel]);
    toast({ title: "Panel added", description: `${config?.name || provider} added to workbench` });
  };

  const removePanel = (panelId: string) => {
    if (panels.length <= 2) {
      toast({ title: "Cannot remove", description: "Minimum 2 panels required", variant: "destructive" });
      return;
    }
    setPanels((prev) => prev.filter((p) => p.id !== panelId));
  };

  const toggleMinimize = (panelId: string) => {
    setMinimizedPanels((prev) => {
      const next = new Set(prev);
      if (next.has(panelId)) {
        next.delete(panelId);
      } else {
        next.add(panelId);
      }
      return next;
    });
  };

  return (
    <Layout>
      <div className="h-[calc(100vh-80px)] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="page-title">
              <Brain className="w-6 h-6 text-primary" />
              AI Workbench
            </h1>
            <p className="text-sm text-muted-foreground">
              Orchestrate multiple AI agents working together
            </p>
          </div>

          <div className="flex items-center gap-2">
            <AddPanelDialog
              onAdd={addPanel}
              existingProviders={panels.map((p) => p.provider)}
            />
            {session?.status === "active" && (
              <Button
                variant="outline"
                onClick={() => setSession((prev) => prev ? { ...prev, status: "paused" } : null)}
                data-testid="button-pause"
              >
                <Pause className="w-4 h-4 mr-2" /> Pause
              </Button>
            )}
          </div>
        </div>

        {!session && (
          <div className="p-4 border-b border-white/10 bg-black/20">
            <div className="max-w-4xl mx-auto space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Main Goal</label>
                <Textarea
                  value={mainGoal}
                  onChange={(e) => setMainGoal(e.target.value)}
                  placeholder="Describe the complex task you want multiple AI agents to work on together..."
                  rows={3}
                  className="bg-black/20"
                  data-testid="input-main-goal"
                />
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">Collaboration Mode</label>
                  <div className="flex gap-2">
                    {Object.entries(COLLABORATION_MODES).map(([key, config]) => {
                      const Icon = config.icon;
                      return (
                        <Button
                          key={key}
                          variant={mode === key ? "default" : "outline"}
                          className="flex-1"
                          onClick={() => setMode(key as typeof mode)}
                          data-testid={`mode-${key}`}
                        >
                          <Icon className="w-4 h-4 mr-2" />
                          {config.name}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                <Button
                  size="lg"
                  onClick={startCollaboration}
                  disabled={!mainGoal.trim() || sendToPanelMutation.isPending}
                  className="px-8"
                  data-testid="button-start"
                >
                  {sendToPanelMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Play className="w-4 h-4 mr-2" />
                  )}
                  Start Collaboration
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                {COLLABORATION_MODES[mode].description}
              </p>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-hidden">
          <ResizablePanelGroup direction="horizontal">
            <ResizablePanel defaultSize={70} minSize={40}>
              <ResizablePanelGroup direction="vertical">
                <ResizablePanel defaultSize={50}>
                  <ResizablePanelGroup direction="horizontal">
                    {panels.slice(0, 2).map((panel, idx) => (
                      <ResizablePanel key={panel.id} defaultSize={50}>
                        {idx > 0 && <ResizableHandle withHandle />}
                        <div className="h-full p-2">
                          <ChatPanel
                            panel={panel}
                            onSendMessage={(id, msg) => sendToPanelMutation.mutate({ panelId: id, message: msg })}
                            onUpdateTask={() => {}}
                            isMinimized={minimizedPanels.has(panel.id)}
                            onToggleMinimize={() => toggleMinimize(panel.id)}
                          />
                        </div>
                      </ResizablePanel>
                    ))}
                  </ResizablePanelGroup>
                </ResizablePanel>

                {panels.length > 2 && (
                  <>
                    <ResizableHandle withHandle />
                    <ResizablePanel defaultSize={50}>
                      <ResizablePanelGroup direction="horizontal">
                        {panels.slice(2).map((panel, idx) => (
                          <ResizablePanel key={panel.id} defaultSize={100 / panels.slice(2).length}>
                            {idx > 0 && <ResizableHandle withHandle />}
                            <div className="h-full p-2">
                              <ChatPanel
                                panel={panel}
                                onSendMessage={(id, msg) => sendToPanelMutation.mutate({ panelId: id, message: msg })}
                                onUpdateTask={() => {}}
                                isMinimized={minimizedPanels.has(panel.id)}
                                onToggleMinimize={() => toggleMinimize(panel.id)}
                              />
                            </div>
                          </ResizablePanel>
                        ))}
                      </ResizablePanelGroup>
                    </ResizablePanel>
                  </>
                )}
              </ResizablePanelGroup>
            </ResizablePanel>

            <ResizableHandle withHandle />

            <ResizablePanel defaultSize={30} minSize={20}>
              <div className="h-full bg-black/20 border-l border-white/10">
                <SynthesisPanel
                  session={session}
                  panels={panels}
                  onRunSynthesis={runSynthesis}
                  isLoading={isSynthesizing}
                />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>
    </Layout>
  );
}
