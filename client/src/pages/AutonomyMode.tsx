/**
 * Autonomy Mode Page v2.0
 * 
 * Allows AI to take autonomous control of the platform.
 * Features supervised and fully autonomous modes with
 * approval workflows and action history.
 * 
 * @version 2.0.0
 * @component AutonomyMode
 * @security Requires explicit user consent for autonomous actions
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Layout from "@/components/dashboard/Layout";
import { 
  Bot, 
  Play, 
  Square, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock,
  Zap,
  Shield,
  Eye,
  Settings,
  History,
  Sparkles,
  Brain
} from "lucide-react";

type AutonomyLevel = "off" | "supervised" | "autonomous";

interface AutonomySession {
  id: string;
  level: AutonomyLevel;
  startedAt: string;
  actionsCount: number;
  goal?: string;
}

interface ActionLog {
  action: string;
  description: string;
  timestamp: string;
  success: boolean;
  result?: any;
  error?: string;
}

interface PendingApproval {
  id: string;
  action: string;
  description: string;
}

export default function AutonomyMode() {
  const queryClient = useQueryClient();
  const [level, setLevel] = useState<AutonomyLevel>("supervised");
  const [goal, setGoal] = useState("");
  const [constraints, setConstraints] = useState("");
  const [provider, setProvider] = useState("openai");
  const [model, setModel] = useState("gpt-4o");
  const [timeoutMinutes, setTimeoutMinutes] = useState(60);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // Fetch active sessions
  const { data: statusData } = useQuery({
    queryKey: ["/api/autonomy/status"],
    refetchInterval: 5000,
  });

  // Fetch pending approvals
  const { data: approvalsData } = useQuery({
    queryKey: ["/api/autonomy/approvals", activeSessionId],
    enabled: !!activeSessionId,
    refetchInterval: 2000,
  });

  // Fetch action history
  const { data: historyData } = useQuery({
    queryKey: ["/api/autonomy/history", activeSessionId],
    enabled: !!activeSessionId,
    refetchInterval: 3000,
  });

  // Start session mutation
  const startSession = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/autonomy/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          level,
          provider,
          model,
          goal: goal || undefined,
          constraints: constraints ? constraints.split("\n").filter(c => c.trim()) : undefined,
          timeoutMinutes,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: (data) => {
      setActiveSessionId(data.sessionId);
      queryClient.invalidateQueries({ queryKey: ["/api/autonomy/status"] });
    },
  });

  // Stop session mutation
  const stopSession = useMutation({
    mutationFn: async (sessionId: string) => {
      const res = await fetch("/api/autonomy/stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      setActiveSessionId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/autonomy/status"] });
    },
  });

  // Execute goal mutation
  const executeGoal = useMutation({
    mutationFn: async (goalText: string) => {
      const res = await fetch("/api/autonomy/goal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: activeSessionId, goal: goalText }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/autonomy/history", activeSessionId] });
    },
  });

  // Approve/reject mutation
  const handleApproval = useMutation({
    mutationFn: async ({ approvalId, approved }: { approvalId: string; approved: boolean }) => {
      const res = await fetch("/api/autonomy/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvalId, approved }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/autonomy/approvals", activeSessionId] });
    },
  });

  const activeSessions = statusData?.activeSessions || [];
  const pendingApprovals = approvalsData?.approvals || [];
  const actionHistory = historyData?.actions || [];

  const getLevelIcon = (lvl: AutonomyLevel) => {
    switch (lvl) {
      case "off": return <XCircle className="h-4 w-4" />;
      case "supervised": return <Eye className="h-4 w-4" />;
      case "autonomous": return <Zap className="h-4 w-4" />;
    }
  };

  const getLevelColor = (lvl: AutonomyLevel) => {
    switch (lvl) {
      case "off": return "secondary";
      case "supervised": return "default";
      case "autonomous": return "destructive";
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Bot className="h-8 w-8" />
              AI Autonomy Mode
              <Badge variant="outline" className="ml-2">v2.0</Badge>
            </h1>
            <p className="text-muted-foreground mt-1">
              Let AI take control and execute tasks autonomously with self-improvement capabilities
            </p>
          </div>
          {activeSessions.length > 0 && (
            <Badge variant="destructive" className="animate-pulse">
              {activeSessions.length} Active Session{activeSessions.length > 1 ? "s" : ""}
            </Badge>
          )}
        </div>

        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Powerful Feature - Use Responsibly</AlertTitle>
          <AlertDescription>
            Autonomy mode allows AI to perform actions on your behalf including code modifications.
            Start with "Supervised" mode to review actions before they execute.
            All actions are logged and can be rolled back.
          </AlertDescription>
        </Alert>

      <Tabs defaultValue="control" className="space-y-4">
        <TabsList>
          <TabsTrigger value="control">
            <Settings className="h-4 w-4 mr-2" />
            Control Panel
          </TabsTrigger>
          <TabsTrigger value="approvals">
            <Shield className="h-4 w-4 mr-2" />
            Pending Approvals
            {pendingApprovals.length > 0 && (
              <Badge variant="secondary" className="ml-2">{pendingApprovals.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="h-4 w-4 mr-2" />
            Action History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="control" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Configuration Card */}
            <Card>
              <CardHeader>
                <CardTitle>Session Configuration</CardTitle>
                <CardDescription>Configure how AI operates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Autonomy Level</Label>
                  <Select value={level} onValueChange={(v) => setLevel(v as AutonomyLevel)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="supervised">
                        <div className="flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          Supervised - Review before execute
                        </div>
                      </SelectItem>
                      <SelectItem value="autonomous">
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4" />
                          Autonomous - Full control
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>AI Provider</Label>
                    <Select value={provider} onValueChange={setProvider}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="openai">OpenAI (GPT-4o)</SelectItem>
                        <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
                        <SelectItem value="google">Google (Gemini)</SelectItem>
                        <SelectItem value="groq">Groq (Llama)</SelectItem>
                        <SelectItem value="xai">xAI (Grok)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Model</Label>
                    <Select value={model} onValueChange={setModel}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gpt-4o">GPT-4o (Recommended)</SelectItem>
                        <SelectItem value="gpt-4o-mini">GPT-4o Mini (Fast)</SelectItem>
                        <SelectItem value="claude-3-5-sonnet">Claude 3.5 Sonnet</SelectItem>
                        <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
                        <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
                        <SelectItem value="gemini-2.0-flash">Gemini 2.0 Flash</SelectItem>
                        <SelectItem value="llama-3.1-70b">Llama 3.1 70B</SelectItem>
                        <SelectItem value="grok-2">Grok 2</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Timeout (minutes)</Label>
                  <Input
                    type="number"
                    value={timeoutMinutes}
                    onChange={(e) => setTimeoutMinutes(parseInt(e.target.value) || 60)}
                    min={1}
                    max={480}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Constraints (one per line)</Label>
                  <Textarea
                    placeholder="Don't delete any files&#10;Don't modify production settings&#10;Ask before spending money"
                    value={constraints}
                    onChange={(e) => setConstraints(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  {!activeSessionId ? (
                    <Button 
                      onClick={() => startSession.mutate()}
                      disabled={startSession.isPending}
                      className="flex-1"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Start Session
                    </Button>
                  ) : (
                    <Button 
                      variant="destructive"
                      onClick={() => stopSession.mutate(activeSessionId)}
                      disabled={stopSession.isPending}
                      className="flex-1"
                    >
                      <Square className="h-4 w-4 mr-2" />
                      Stop Session
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Goal Execution Card */}
            <Card>
              <CardHeader>
                <CardTitle>Execute Goal</CardTitle>
                <CardDescription>Tell AI what you want to accomplish</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Goal</Label>
                  <Textarea
                    placeholder="Create a new project called 'Marketing Campaign' and set up integrations with Google Drive and Notion..."
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    rows={5}
                  />
                </div>

                <Button
                  onClick={() => executeGoal.mutate(goal)}
                  disabled={!activeSessionId || !goal || executeGoal.isPending}
                  className="w-full"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Execute Goal
                </Button>

                {executeGoal.data && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertTitle>Goal Execution Complete</AlertTitle>
                    <AlertDescription>
                      {executeGoal.data.steps?.length || 0} steps executed
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Active Sessions */}
          {activeSessions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Active Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {activeSessions.map((session: AutonomySession) => (
                    <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getLevelIcon(session.level)}
                        <div>
                          <p className="font-medium">{session.id.slice(0, 20)}...</p>
                          <p className="text-sm text-muted-foreground">
                            Started {new Date(session.startedAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getLevelColor(session.level)}>
                          {session.level}
                        </Badge>
                        <Badge variant="outline">
                          {session.actionsCount} actions
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="approvals">
          <Card>
            <CardHeader>
              <CardTitle>Pending Approvals</CardTitle>
              <CardDescription>
                Actions waiting for your approval (Supervised mode)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingApprovals.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No pending approvals
                </p>
              ) : (
                <div className="space-y-3">
                  {pendingApprovals.map((approval: PendingApproval) => (
                    <div key={approval.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <Badge variant="outline" className="mb-2">{approval.action}</Badge>
                        <p>{approval.description}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleApproval.mutate({ approvalId: approval.id, approved: false })}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleApproval.mutate({ approvalId: approval.id, approved: true })}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Action History</CardTitle>
              <CardDescription>
                All actions performed in the current session
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {actionHistory.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No actions yet
                  </p>
                ) : (
                  <div className="space-y-2">
                    {actionHistory.map((action: ActionLog, i: number) => (
                      <div key={i} className="flex items-start gap-3 p-3 border rounded-lg">
                        {action.success ? (
                          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{action.action}</Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(action.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-sm mt-1">{action.description}</p>
                          {action.error && (
                            <p className="text-sm text-red-500 mt-1">{action.error}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
