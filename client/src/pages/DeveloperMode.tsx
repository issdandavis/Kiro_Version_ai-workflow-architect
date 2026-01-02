/**
 * Developer Mode Page v2.0
 * 
 * In-app code editor for self-improvement capabilities.
 * Allows direct modification of source code with AI assistance,
 * version control, and rollback functionality.
 * 
 * @version 2.0.0
 * @component DeveloperMode
 * @security Requires elevated permissions, all changes logged
 */

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import Layout from "@/components/dashboard/Layout";
import { 
  Code, 
  FolderTree, 
  File, 
  Folder,
  Save,
  Undo,
  Sparkles,
  Search,
  Play,
  Square,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  Plus,
  Trash2,
  History,
  RefreshCw,
  GitBranch,
  Terminal,
  Brain
} from "lucide-react";

interface FileItem {
  name: string;
  path: string;
  type: "file" | "directory";
  size?: number;
}

interface FileChange {
  id: string;
  filePath: string;
  timestamp: string;
  description: string;
  aiGenerated: boolean;
}

export default function DeveloperMode() {
  const queryClient = useQueryClient();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentPath, setCurrentPath] = useState("");
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState("");
  const [originalContent, setOriginalContent] = useState("");
  const [fileLanguage, setFileLanguage] = useState("plaintext");
  const [searchPattern, setSearchPattern] = useState("");
  const [aiInstruction, setAiInstruction] = useState("");
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set([""]));
  const [showAiDialog, setShowAiDialog] = useState(false);
  const [aiImprovement, setAiImprovement] = useState<{
    originalContent: string;
    improvedContent: string;
    explanation: string;
  } | null>(null);

  // Fetch files in current directory
  const { data: filesData, refetch: refetchFiles } = useQuery({
    queryKey: ["/api/devmode/files", currentPath],
    queryFn: async () => {
      const res = await fetch(`/api/devmode/files?dir=${encodeURIComponent(currentPath)}`);
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    enabled: !!sessionId,
  });

  // Fetch change history
  const { data: historyData } = useQuery({
    queryKey: ["/api/devmode/history"],
    enabled: !!sessionId,
    refetchInterval: 5000,
  });

  // Fetch project tree
  const { data: treeData } = useQuery({
    queryKey: ["/api/devmode/tree"],
    enabled: !!sessionId,
  });

  // Start session mutation
  const startSession = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/devmode/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: (data) => {
      setSessionId(data.sessionId);
    },
  });

  // Stop session mutation
  const stopSession = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/devmode/stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      setSessionId(null);
      setSelectedFile(null);
      setFileContent("");
    },
  });

  // Read file mutation
  const readFile = useMutation({
    mutationFn: async (filePath: string) => {
      const res = await fetch(`/api/devmode/file?path=${encodeURIComponent(filePath)}`);
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: (data, filePath) => {
      setSelectedFile(filePath);
      setFileContent(data.content);
      setOriginalContent(data.content);
      setFileLanguage(data.language);
    },
  });

  // Save file mutation
  const saveFile = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/devmode/file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          filePath: selectedFile,
          content: fileContent,
          description: "Manual edit",
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      setOriginalContent(fileContent);
      queryClient.invalidateQueries({ queryKey: ["/api/devmode/history"] });
    },
  });

  // Create file mutation
  const createFile = useMutation({
    mutationFn: async ({ filePath, content }: { filePath: string; content: string }) => {
      const res = await fetch("/api/devmode/file/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, filePath, content }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      refetchFiles();
      queryClient.invalidateQueries({ queryKey: ["/api/devmode/history"] });
    },
  });

  // Delete file mutation
  const deleteFile = useMutation({
    mutationFn: async (filePath: string) => {
      const res = await fetch("/api/devmode/file", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, filePath }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      setSelectedFile(null);
      setFileContent("");
      refetchFiles();
      queryClient.invalidateQueries({ queryKey: ["/api/devmode/history"] });
    },
  });

  // Rollback mutation
  const rollback = useMutation({
    mutationFn: async (changeId: string) => {
      const res = await fetch("/api/devmode/rollback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, changeId }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      if (selectedFile) {
        readFile.mutate(selectedFile);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/devmode/history"] });
    },
  });

  // AI improve mutation
  const aiImprove = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/devmode/ai/improve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          filePath: selectedFile,
          instruction: aiInstruction,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: (data) => {
      setAiImprovement(data);
    },
  });

  // Apply AI improvement mutation
  const applyAiImprovement = useMutation({
    mutationFn: async () => {
      if (!aiImprovement) return;
      const res = await fetch("/api/devmode/ai/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          filePath: selectedFile,
          improvedContent: aiImprovement.improvedContent,
          explanation: aiImprovement.explanation,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      if (aiImprovement) {
        setFileContent(aiImprovement.improvedContent);
        setOriginalContent(aiImprovement.improvedContent);
      }
      setAiImprovement(null);
      setShowAiDialog(false);
      queryClient.invalidateQueries({ queryKey: ["/api/devmode/history"] });
    },
  });

  // Search mutation
  const searchCode = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/devmode/search?pattern=${encodeURIComponent(searchPattern)}`);
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  });

  const files = filesData?.files || [];
  const changeHistory = historyData?.changes || [];
  const hasUnsavedChanges = fileContent !== originalContent;

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  const handleFileClick = (file: FileItem) => {
    if (file.type === "directory") {
      toggleFolder(file.path);
      setCurrentPath(file.path);
    } else {
      readFile.mutate(file.path);
    }
  };

  const getFileIcon = (file: FileItem) => {
    if (file.type === "directory") {
      return expandedFolders.has(file.path) ? (
        <ChevronDown className="h-4 w-4" />
      ) : (
        <ChevronRight className="h-4 w-4" />
      );
    }
    return <File className="h-4 w-4" />;
  };

  if (!sessionId) {
    return (
      <Layout>
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-6 w-6" />
              Developer Mode
              <Badge variant="outline" className="ml-2">v2.0</Badge>
            </CardTitle>
            <CardDescription>
              Edit the application's source code directly. Enable self-improvement capabilities for AI-driven enhancements.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Warning - Advanced Feature</AlertTitle>
              <AlertDescription>
                Developer mode allows direct modification of the application's source code.
                Changes can break the application. All modifications are logged and can be rolled back.
                Use with caution and always test changes in a safe environment first.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <h3 className="font-medium">Self-Improvement Capabilities:</h3>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Browse and edit source files with syntax highlighting</li>
                <li>Create new components, pages, and features</li>
                <li>Use AI to improve code automatically with explanations</li>
                <li>Rollback changes if something breaks</li>
                <li>Search across the entire codebase</li>
                <li>Version control integration for safe experimentation</li>
                <li>AI-powered code review and suggestions</li>
              </ul>
            </div>

            <Button 
              onClick={() => startSession.mutate()}
              disabled={startSession.isPending}
              className="w-full"
            >
              <Play className="h-4 w-4 mr-2" />
              Activate Developer Mode
            </Button>
          </CardContent>
        </Card>
      </Layout>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b p-4 flex items-center justify-between bg-background">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Code className="h-5 w-5" />
            Developer Mode
          </h1>
          <Badge variant="outline" className="animate-pulse">Active</Badge>
        </div>
        <div className="flex items-center gap-2">
          {hasUnsavedChanges && (
            <Badge variant="destructive">Unsaved Changes</Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => stopSession.mutate()}
          >
            <Square className="h-4 w-4 mr-2" />
            Exit Developer Mode
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* File Explorer */}
        <div className="w-64 border-r flex flex-col">
          <div className="p-2 border-b">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Search files..."
                value={searchPattern}
                onChange={(e) => setSearchPattern(e.target.value)}
                className="h-8"
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => searchCode.mutate()}
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2">
              <div className="flex items-center gap-1 mb-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentPath("")}
                >
                  <FolderTree className="h-4 w-4 mr-1" />
                  Root
                </Button>
                {currentPath && (
                  <>
                    <span>/</span>
                    <span className="text-sm text-muted-foreground truncate">
                      {currentPath}
                    </span>
                  </>
                )}
              </div>
              <Separator className="mb-2" />
              {files.map((file: FileItem) => (
                <div
                  key={file.path}
                  className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-accent ${
                    selectedFile === file.path ? "bg-accent" : ""
                  }`}
                  onClick={() => handleFileClick(file)}
                >
                  {getFileIcon(file)}
                  <span className="text-sm truncate">{file.name}</span>
                  {file.type === "file" && file.size && (
                    <span className="text-xs text-muted-foreground ml-auto">
                      {(file.size / 1024).toFixed(1)}KB
                    </span>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
          <div className="p-2 border-t">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                const name = prompt("Enter file name:");
                if (name) {
                  createFile.mutate({
                    filePath: currentPath ? `${currentPath}/${name}` : name,
                    content: "",
                  });
                }
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              New File
            </Button>
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 flex flex-col">
          {selectedFile ? (
            <>
              {/* Editor Toolbar */}
              <div className="border-b p-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{fileLanguage}</Badge>
                  <span className="text-sm text-muted-foreground">{selectedFile}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Dialog open={showAiDialog} onOpenChange={setShowAiDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Sparkles className="h-4 w-4 mr-2" />
                        AI Improve
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl">
                      <DialogHeader>
                        <DialogTitle>AI Code Improvement</DialogTitle>
                        <DialogDescription>
                          Describe what you want to improve or change
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Instruction</Label>
                          <Textarea
                            placeholder="Add error handling, improve performance, add comments, refactor to use hooks..."
                            value={aiInstruction}
                            onChange={(e) => setAiInstruction(e.target.value)}
                            rows={3}
                          />
                        </div>
                        {!aiImprovement ? (
                          <Button
                            onClick={() => aiImprove.mutate()}
                            disabled={aiImprove.isPending || !aiInstruction}
                            className="w-full"
                          >
                            {aiImprove.isPending ? (
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Sparkles className="h-4 w-4 mr-2" />
                            )}
                            Generate Improvement
                          </Button>
                        ) : (
                          <div className="space-y-4">
                            <Alert>
                              <Sparkles className="h-4 w-4" />
                              <AlertTitle>AI Explanation</AlertTitle>
                              <AlertDescription>{aiImprovement.explanation}</AlertDescription>
                            </Alert>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Original</Label>
                                <ScrollArea className="h-48 border rounded p-2 mt-1">
                                  <pre className="text-xs">{aiImprovement.originalContent}</pre>
                                </ScrollArea>
                              </div>
                              <div>
                                <Label>Improved</Label>
                                <ScrollArea className="h-48 border rounded p-2 mt-1">
                                  <pre className="text-xs">{aiImprovement.improvedContent}</pre>
                                </ScrollArea>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                onClick={() => setAiImprovement(null)}
                                className="flex-1"
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={() => applyAiImprovement.mutate()}
                                disabled={applyAiImprovement.isPending}
                                className="flex-1"
                              >
                                Apply Changes
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFileContent(originalContent)}
                    disabled={!hasUnsavedChanges}
                  >
                    <Undo className="h-4 w-4 mr-2" />
                    Revert
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => saveFile.mutate()}
                    disabled={!hasUnsavedChanges || saveFile.isPending}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      if (confirm("Delete this file?")) {
                        deleteFile.mutate(selectedFile);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {/* Code Editor */}
              <div className="flex-1 p-4">
                <Textarea
                  value={fileContent}
                  onChange={(e) => setFileContent(e.target.value)}
                  className="h-full font-mono text-sm resize-none"
                  placeholder="File content..."
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <File className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a file to edit</p>
              </div>
            </div>
          )}
        </div>

        {/* History Panel */}
        <div className="w-64 border-l flex flex-col">
          <div className="p-3 border-b">
            <h3 className="font-medium flex items-center gap-2">
              <History className="h-4 w-4" />
              Change History
            </h3>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-2">
              {changeHistory.map((change: FileChange) => (
                <div key={change.id} className="p-2 border rounded text-sm">
                  <div className="flex items-center gap-2 mb-1">
                    {change.aiGenerated && (
                      <Sparkles className="h-3 w-3 text-purple-500" />
                    )}
                    <span className="truncate font-medium">{change.filePath.split("/").pop()}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{change.description}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-muted-foreground">
                      {new Date(change.timestamp).toLocaleTimeString()}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs"
                      onClick={() => rollback.mutate(change.id)}
                    >
                      <Undo className="h-3 w-3 mr-1" />
                      Undo
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Search Results */}
      {searchCode.data && searchCode.data.results.length > 0 && (
        <div className="border-t p-4 max-h-48 overflow-auto">
          <h3 className="font-medium mb-2">Search Results ({searchCode.data.count})</h3>
          <div className="space-y-1">
            {searchCode.data.results.slice(0, 20).map((result: any, i: number) => (
              <div
                key={i}
                className="text-sm p-2 hover:bg-accent rounded cursor-pointer"
                onClick={() => readFile.mutate(result.filePath)}
              >
                <span className="text-muted-foreground">{result.filePath}:{result.line}</span>
                <pre className="text-xs truncate">{result.content}</pre>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
