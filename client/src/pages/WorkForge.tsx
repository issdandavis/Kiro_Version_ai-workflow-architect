import { useState, useEffect, useCallback, useRef, useMemo } from "react";

// ============================================================
// WORKFORGE - Gamified Workflow Automation Visualizer
// Salvaged from Pipedream project (RIP $300)
// Dwarf Fortress meets real automation output
// ============================================================

// --- TYPES ---

type TileType = "ground" | "wall" | "water" | "forge" | "mine" | "portal" | "chest" | "tree";

interface Position { x: number; y: number; }

interface WorkerEntity {
    id: string;
    name: string;
    emoji: string;
    pos: Position;
    targetPos: Position | null;
    health: number;
    maxHealth: number;
    xp: number;
    level: number;
    job: WorkerJob | null;
    status: "idle" | "working" | "moving" | "resting" | "error";
    color: string;
    stats: { filesProcessed: number; eventsRouted: number; messagesRelayed: number; errorsFixed: number; };
    sourceWorkflow: string;
}

interface WorkerJob {
    type: "mine" | "craft" | "scout" | "relay" | "guard" | "heal";
    label: string;
    progress: number;
    maxProgress: number;
    reward: { xp: number; resource?: string; amount?: number; };
}

interface Quest {
    id: string;
    title: string;
    description: string;
    category: "code_changes" | "code_review" | "issue_management" | "release_management" | "ci_cd" | "security";
    priority: "critical" | "high" | "medium" | "low";
    status: "available" | "active" | "completed" | "failed";
    assignedWorker: string | null;
    reward: { xp: number; gold: number; };
    emoji: string;
}

interface Resource {
    name: string;
    emoji: string;
    amount: number;
    category: "documents" | "code" | "images" | "data" | "messages" | "gold";
}

interface GameLog {
    timestamp: number;
    message: string;
    type: "info" | "success" | "warning" | "error" | "quest" | "loot";
}

interface BiomeWeather {
    name: string;
    emoji: string;
    effect: string;
    servicesUp: number;
    servicesTotal: number;
}

// --- SALVAGED PIPEDREAM CODE: Event Router (adapted) ---

function categorizeEvent(eventType: string): Quest["category"] {
    if (eventType.includes("push") || eventType.includes("create")) return "code_changes";
    if (eventType.includes("pull_request")) return "code_review";
    if (eventType.includes("issues")) return "issue_management";
    if (eventType.includes("release")) return "release_management";
    if (eventType.includes("workflow") || eventType.includes("check_")) return "ci_cd";
    if (eventType.includes("security") || eventType.includes("dependabot")) return "security";
    return "code_changes";
}

function determinePriority(eventType: string): Quest["priority"] {
    if (eventType.includes("security") || eventType.includes("dependabot")) return "critical";
    if (eventType.includes("release") || eventType.includes("failure")) return "high";
    if (eventType.includes("pull_request") || eventType.includes("issues")) return "medium";
    return "low";
}

function mapToQuestEmoji(category: Quest["category"]): string {
    const map: Record<string, string> = {
          code_changes: "⚔️", code_review: "🔍", issue_management: "📋",
          release_management: "🚀", ci_cd: "⚙️", security: "🛡️",
    };
    return map[category] || "❓";
}

// --- SALVAGED PIPEDREAM CODE: File Categorizer (adapted from Dropbox analyzer) ---

function categorizeFileType(ext: string): Resource["category"] {
    const cats: Record<string, string[]> = {
          documents: [".pdf", ".doc", ".docx", ".txt", ".rtf", ".md"],
          code: [".js", ".ts", ".py", ".html", ".css", ".java", ".cpp", ".mjs", ".tsx", ".jsx"],
          images: [".jpg", ".jpeg", ".png", ".gif", ".svg", ".webp"],
          data: [".json", ".csv", ".xml", ".yaml", ".yml", ".sql"],
    };
    for (const [cat, exts] of Object.entries(cats)) {
          if (exts.includes(ext.toLowerCase())) return cat as Resource["category"];
    }
    return "data";
}

function analyzeResources(files: { name: string; size: number }[]): Resource[] {
    const counts: Record<string, { count: number; emoji: string; cat: Resource["category"] }> = {};
    files.forEach((f) => {
          const ext = f.name.includes(".") ? f.name.substring(f.name.lastIndexOf(".")) : "";
          const cat = categorizeFileType(ext);
          if (!counts[cat]) {
                  const emojis: Record<string, string> = { documents: "📜", code: "💎", images: "🖼️", data: "📊", messages: "✉️", gold: "🪙" };
                  counts[cat] = { count: 0, emoji: emojis[cat] || "📦", cat };
          }
          counts[cat].count++;
    });
    return Object.values(counts).map((c) => ({ name: c.cat, emoji: c.emoji, amount: c.count, category: c.cat }));
}

// --- MAP GENERATION ---

const MAP_W = 40;
const MAP_H = 20;

function generateMap(): TileType[][] {
    const map: TileType[][] = [];
    for (let y = 0; y < MAP_H; y++) {
          const row: TileType[] = [];
          for (let x = 0; x < MAP_W; x++) {
                  if (y === 0 || y === MAP_H - 1 || x === 0 || x === MAP_W - 1) {
                            row.push("wall");
                  } else if (Math.random() < 0.03) {
                            row.push("tree");
                  } else if (Math.random() < 0.02) {
                            row.push("water");
                  } else {
                            row.push("ground");
                  }
          }
          map.push(row);
    }
    // Place structures
  map[3][5] = "forge"; map[3][6] = "forge";
    map[10][30] = "mine"; map[10][31] = "mine"; map[11][30] = "mine";
    map[15][20] = "portal";
    map[5][18] = "chest"; map[8][35] = "chest"; map[16][10] = "chest";
    return map;
}

// --- TILE RENDERING ---

const TILE_CHARS: Record<TileType, { char: string; color: string; bg: string }> = {
    ground:  { char: ".", color: "#3a3a3a", bg: "#1a1a2e" },
    wall:    { char: "█", color: "#4a4a5a", bg: "#1a1a2e" },
    water:   { char: "≈", color: "#4488ff", bg: "#112244" },
    forge:   { char: "♨", color: "#ff6644", bg: "#331100" },
    mine:    { char: "⛏", color: "#ccaa44", bg: "#222200" },
    portal:  { char: "◎", color: "#aa44ff", bg: "#220044" },
    chest:   { char: "◆", color: "#ffcc00", bg: "#332200" },
    tree:    { char: "♣", color: "#44aa44", bg: "#0a220a" },
};

// --- INITIAL GAME STATE ---

function createInitialWorkers(): WorkerEntity[] {
    return [
      {
              id: "w1", name: "EventRouter", emoji: "⚡", pos: { x: 5, y: 5 }, targetPos: null,
              health: 100, maxHealth: 100, xp: 0, level: 1,
              job: null, status: "idle", color: "#44ff88",
              stats: { filesProcessed: 0, eventsRouted: 0, messagesRelayed: 0, errorsFixed: 0 },
              sourceWorkflow: "github-management-automation-hub",
      },
      {
              id: "w2", name: "FileAnalyzer", emoji: "🔬", pos: { x: 30, y: 10 }, targetPos: null,
              health: 85, maxHealth: 100, xp: 0, level: 1,
              job: null, status: "idle", color: "#44aaff",
              stats: { filesProcessed: 0, eventsRouted: 0, messagesRelayed: 0, errorsFixed: 0 },
              sourceWorkflow: "dropbox-organization-agent",
      },
      {
              id: "w3", name: "AiOracle", emoji: "🔮", pos: { x: 20, y: 15 }, targetPos: null,
              health: 90, maxHealth: 100, xp: 0, level: 1,
              job: null, status: "idle", color: "#ff88ff",
              stats: { filesProcessed: 0, eventsRouted: 0, messagesRelayed: 0, errorsFixed: 0 },
              sourceWorkflow: "claude-chatgpt-integration",
      },
      {
              id: "w4", name: "SlackRelay", emoji: "📡", pos: { x: 15, y: 3 }, targetPos: null,
              health: 95, maxHealth: 100, xp: 0, level: 1,
              job: null, status: "idle", color: "#ffaa44",
              stats: { filesProcessed: 0, eventsRouted: 0, messagesRelayed: 0, errorsFixed: 0 },
              sourceWorkflow: "ai-code-review-bot-for-slack",
      },
      {
              id: "w5", name: "CloudSync", emoji: "☁️", pos: { x: 35, y: 16 }, targetPos: null,
              health: 70, maxHealth: 100, xp: 0, level: 1,
              job: null, status: "idle", color: "#88ccff",
              stats: { filesProcessed: 0, eventsRouted: 0, messagesRelayed: 0, errorsFixed: 0 },
              sourceWorkflow: "ai-powered-dropbox-file-automation",
      },
        ];
}

function generateQuest(): Quest {
    const types = ["push.created", "pull_request.opened", "issues.opened", "release.published", "workflow_run.completed", "security_advisory.published"];
    const eventType = types[Math.floor(Math.random() * types.length)];
    const category = categorizeEvent(eventType);
    const priority = determinePriority(eventType);
    const titles: Record<string, string[]> = {
          code_changes: ["Defend the Main Branch", "Code Push Incoming", "New Commit Wave"],
          code_review: ["Review the Sacred PR", "Inspect Incoming Code", "Approve the Merge Ritual"],
          issue_management: ["Triage New Report", "Investigate Bug Sighting", "Sort the Issue Scroll"],
          release_management: ["Ship the Artifact", "Deploy to Production Realm", "Release the Build"],
          ci_cd: ["Fix the Pipeline", "Rebuild the Forge", "Restart Failed Construct"],
          security: ["Repel Security Threat", "Patch the Vulnerability", "Shield the Perimeter"],
    };
    const questTitles = titles[category] || ["Unknown Quest"];
    return {
          id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          title: questTitles[Math.floor(Math.random() * questTitles.length)],
          description: `A ${priority} priority ${category.replace(/_/g, " ")} event requires attention.`,
          category, priority, status: "available", assignedWorker: null,
          reward: { xp: priority === "critical" ? 50 : priority === "high" ? 30 : priority === "medium" ? 20 : 10, gold: Math.floor(Math.random() * 20) + 5 },
          emoji: mapToQuestEmoji(category),
    };
}

// --- MAIN COMPONENT ---

export default function WorkForge() {
    const [map] = useState<TileType[][]>(() => generateMap());
    const [workers, setWorkers] = useState<WorkerEntity[]>(() => createInitialWorkers());
    const [quests, setQuests] = useState<Quest[]>(() => [generateQuest(), generateQuest(), generateQuest()]);
    const [resources, setResources] = useState<Resource[]>([
      { name: "documents", emoji: "📜", amount: 12, category: "documents" },
      { name: "code", emoji: "💎", amount: 34, category: "code" },
      { name: "images", emoji: "🖼️", amount: 8, category: "images" },
      { name: "data", emoji: "📊", amount: 21, category: "data" },
      { name: "messages", emoji: "✉️", amount: 15, category: "messages" },
      { name: "gold", emoji: "🪙", amount: 100, category: "gold" },
        ]);
    const [logs, setLogs] = useState<GameLog[]>([
      { timestamp: Date.now(), message: "⚒️ WorkForge initialized. Colony awakens.", type: "info" },
      { timestamp: Date.now(), message: "🗺️ Map generated. 5 workers reporting for duty.", type: "info" },
      { timestamp: Date.now(), message: "📦 Salvaged code from Pipedream (RIP $300) loaded.", type: "success" },
        ]);
    const [weather, setWeather] = useState<BiomeWeather>({ name: "Clear Skies", emoji: "☀️", effect: "+10% work speed", servicesUp: 5, servicesTotal: 6 });
    const [tick, setTick] = useState(0);
    const [selectedWorker, setSelectedWorker] = useState<string | null>(null);
    const [isPaused, setIsPaused] = useState(false);
    const [gameSpeed, setGameSpeed] = useState(1);
    const logRef = useRef<HTMLDivElement>(null);

  const addLog = useCallback((message: string, type: GameLog["type"] = "info") => {
        setLogs((prev) => [...prev.slice(-50), { timestamp: Date.now(), message, type }]);
  }, []);

  // --- GAME LOOP ---
  useEffect(() => {
        if (isPaused) return;
        const interval = setInterval(() => {
                setTick((t) => t + 1);

                                           // Move workers toward targets
                                           setWorkers((prev) => prev.map((w) => {
                                                     if (w.status === "error") {
                                                                 if (Math.random() < 0.1) return { ...w, status: "idle", health: Math.min(w.maxHealth, w.health + 10) };
                                                                 return w;
                                                     }
                                                     if (w.job) {
                                                                 const newProgress = w.job.progress + (Math.random() < 0.7 ? 1 : 0);
                                                                 if (newProgress >= w.job.maxProgress) {
                                                                               // Job complete
                                                                   const newXp = w.xp + w.job.reward.xp;
                                                                               const newLevel = Math.floor(newXp / 100) + 1;
                                                                               addLog(`✅ ${w.emoji} ${w.name} completed: ${w.job.label} (+${w.job.reward.xp} XP)`, "success");
                                                                               if (w.job.reward.resource) {
                                                                                               setResources((r) => r.map((res) => res.category === w.job!.reward.resource ? { ...res, amount: res.amount + (w.job!.reward.amount || 1) } : res));
                                                                               }
                                                                               const stat = w.job.type === "mine" ? "filesProcessed" : w.job.type === "scout" ? "eventsRouted" : w.job.type === "relay" ? "messagesRelayed" : "errorsFixed";
                                                                               return { ...w, job: null, status: "idle", xp: newXp, level: newLevel, stats: { ...w.stats, [stat]: w.stats[stat] + 1 } };
                                                                 }
                                                                 return { ...w, job: { ...w.job, progress: newProgress }, status: "working" };
                                                     }
                                                     // Random movement when idle
                                                                                 if (w.status === "idle" && Math.random() < 0.3) {
                                                                                             const dx = Math.floor(Math.random() * 3) - 1;
                                                                                             const dy = Math.floor(Math.random() * 3) - 1;
                                                                                             const nx = Math.max(1, Math.min(MAP_W - 2, w.pos.x + dx));
                                                                                             const ny = Math.max(1, Math.min(MAP_H - 2, w.pos.y + dy));
                                                                                             if (map[ny][nx] !== "wall" && map[ny][nx] !== "water") {
                                                                                                           return { ...w, pos: { x: nx, y: ny } };
                                                                                               }
                                                                                 }
                                                     return w;
                                           }));

                                           // Random events
                                           if (Math.random() < 0.05) {
                                                     setQuests((prev) => {
                                                                 if (prev.filter((q) => q.status === "available").length < 5) {
                                                                               const newQ = generateQuest();
                                                                               addLog(`${newQ.emoji} New quest: "${newQ.title}" [${newQ.priority.toUpperCase()}]`, "quest");
                                                                               return [...prev, newQ];
                                                                 }
                                                                 return prev;
                                                     });
                                           }

                                           // Auto-assign idle workers to quests
                                           setWorkers((prev) => {
                                                     const idle = prev.filter((w) => w.status === "idle" && !w.job);
                                                     if (idle.length === 0) return prev;
                                                     const worker = idle[Math.floor(Math.random() * idle.length)];
                                                     const availableQuests = quests.filter((q) => q.status === "available");
                                                     if (availableQuests.length === 0) return prev;

                                                              if (Math.random() < 0.15) {
                                                                          const quest = availableQuests[0];
                                                                          setQuests((qprev) => qprev.map((q) => q.id === quest.id ? { ...q, status: "active", assignedWorker: worker.id } : q));
                                                                          const jobTypes: WorkerJob["type"][] = ["mine", "craft", "scout", "relay", "guard", "heal"];
                                                                          const jobType = jobTypes[Math.floor(Math.random() * jobTypes.length)];
                                                                          addLog(`${worker.emoji} ${worker.name} takes quest: "${quest.title}"`, "info");
                                                                          return prev.map((w) => w.id === worker.id ? {
                                                                                        ...w, status: "working",
                                                                                        job: { type: jobType, label: quest.title, progress: 0, maxProgress: 8 + Math.floor(Math.random() * 12), reward: { xp: quest.reward.xp, resource: "code", amount: Math.floor(Math.random() * 3) + 1 } },
                                                                          } : w);
                                                              }
                                                     return prev;
                                           });

                                           // Weather changes
                                           if (Math.random() < 0.02) {
                                                     const weathers: BiomeWeather[] = [
                                                       { name: "Clear Skies", emoji: "☀️", effect: "+10% work speed", servicesUp: 6, servicesTotal: 6 },
                                                       { name: "API Storm", emoji: "⛈️", effect: "-20% reliability", servicesUp: 4, servicesTotal: 6 },
                                                       { name: "Rate Limit Fog", emoji: "🌫️", effect: "Slower responses", servicesUp: 5, servicesTotal: 6 },
                                                       { name: "Deploy Winds", emoji: "🌪️", effect: "Fast but risky", servicesUp: 5, servicesTotal: 6 },
                                                       { name: "Golden Hour", emoji: "🌅", effect: "+25% XP gains", servicesUp: 6, servicesTotal: 6 },
                                                       { name: "Downtime Eclipse", emoji: "🌑", effect: "Service outage!", servicesUp: 2, servicesTotal: 6 },
                                                               ];
                                                     const newWeather = weathers[Math.floor(Math.random() * weathers.length)];
                                                     setWeather(newWeather);
                                                     addLog(`${newWeather.emoji} Weather: ${newWeather.name} — ${newWeather.effect}`, newWeather.servicesUp < 4 ? "warning" : "info");
                                           }

                                           // Random worker errors
                                           if (Math.random() < 0.02) {
                                                     setWorkers((prev) => {
                                                                 const working = prev.filter((w) => w.status === "working");
                                                                 if (working.length === 0) return prev;
                                                                 const unlucky = working[Math.floor(Math.random() * working.length)];
                                                                 addLog(`💥 ${unlucky.emoji} ${unlucky.name} encountered an error!`, "error");
                                                                 return prev.map((w) => w.id === unlucky.id ? { ...w, status: "error", health: Math.max(0, w.health - 15), job: null } : w);
                                                     });
                                           }

                                           // Complete active quests when workers finish
                                           setQuests((prev) => prev.map((q) => {
                                                     if (q.status === "active" && q.assignedWorker) {
                                                                 const worker = workers.find((w) => w.id === q.assignedWorker);
                                                                 if (worker && !worker.job && worker.status === "idle") {
                                                                               setResources((r) => r.map((res) => res.category === "gold" ? { ...res, amount: res.amount + q.reward.gold } : res));
                                                                               addLog(`🏆 Quest complete: "${q.title}" (+${q.reward.gold} 🪙)`, "loot");
                                                                               return { ...q, status: "completed" };
                                                                 }
                                                     }
                                                     return q;
                                           }));

        }, 800 / gameSpeed);
        return () => clearInterval(interval);
  }, [isPaused, gameSpeed, map, quests, workers, addLog]);

  // Auto-scroll log
  useEffect(() => { logRef.current?.scrollTo(0, logRef.current.scrollHeight); }, [logs]);

  // --- RENDER MAP ---
  const renderedMap = useMemo(() => {
        const cells: JSX.Element[] = [];
        for (let y = 0; y < MAP_H; y++) {
                for (let x = 0; x < MAP_W; x++) {
                          const worker = workers.find((w) => w.pos.x === x && w.pos.y === y);
                          const tile = TILE_CHARS[map[y][x]];
                          const isSelected = worker && selectedWorker === worker.id;
                          cells.push(
                                      <span
                                                    key={`${x}-${y}`}
                                                    onClick={() => worker && setSelectedWorker(worker.id)}
                                                    style={{
                                                                    color: worker ? worker.color : tile.color,
                                                                    backgroundColor: isSelected ? "#443366" : worker ? "#222244" : tile.bg,
                                                                    cursor: worker ? "pointer" : "default",
                                                                    fontWeight: worker ? "bold" : "normal",
                                                                    textShadow: worker ? `0 0 6px ${worker.color}` : "none",
                                                                    transition: "all 0.15s",
                                                    }}
                                                    title={worker ? `${worker.emoji} ${worker.name} [${worker.status}] HP:${worker.health} LVL:${worker.level}` : `${map[y][x]}`}
                                                  >
                                        {worker ? worker.emoji : tile.char}
                                      </span>span>
                                    );
                }
                cells.push(<br key={`br-${y}`} />);
        }
        return cells;
  }, [map, workers, selectedWorker]);
  
    const selectedW = workers.find((w) => w.id === selectedWorker);
    const activeQuests = quests.filter((q) => q.status === "available" || q.status === "active");
    const completedCount = quests.filter((q) => q.status === "completed").length;
  
    const priorityColor: Record<string, string> = { critical: "#ff4444", high: "#ff8844", medium: "#ffcc44", low: "#88cc88" };
    const statusColor: Record<string, string> = { idle: "#88cc88", working: "#44aaff", moving: "#cccc44", resting: "#aa88cc", error: "#ff4444" };
    const logColor: Record<string, string> = { info: "#8888aa", success: "#44cc66", warning: "#ccaa44", error: "#ff4444", quest: "#aa88ff", loot: "#ffcc44" };
  
    return (
          <div style={{ background: "#0a0a14", color: "#ccccdd", minHeight: "100vh", fontFamily: "'Courier New', monospace", padding: "8px" }}>
            {/* HEADER BAR */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #333", paddingBottom: "6px", marginBottom: "8px", flexWrap: "wrap", gap: "8px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                  <span style={{ fontSize: "20px", fontWeight: "bold", color: "#ff8844" }}>⚒️ WORKFORGE</span>span>
                                  <span style={{ fontSize: "11px", color: "#666" }}>Tick: {tick}</span>span>
                                  <span style={{ fontSize: "11px", color: "#888" }}>{weather.emoji} {weather.name}</span>span>
                                  <span style={{ fontSize: "11px", color: weather.servicesUp < 4 ? "#ff4444" : "#44cc66" }}>
                                              [{weather.servicesUp}/{weather.servicesTotal} services]
                                  </span>span>
                        </div>div>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                          {resources.map((r) => (
                        <span key={r.name} style={{ fontSize: "11px", color: "#aaa" }} title={r.name}>
                          {r.emoji}{r.amount}
                        </span>span>
                      ))}
                                  <span style={{ margin: "0 4px", color: "#333" }}>|</span>span>
                                  <button onClick={() => setIsPaused(!isPaused)} style={{ background: isPaused ? "#446644" : "#664444", color: "#ddd", border: "1px solid #555", padding: "2px 8px", cursor: "pointer", fontFamily: "inherit", fontSize: "11px" }}>
                                    {isPaused ? "▶ PLAY" : "⏸ PAUSE"}
                                  </button>button>
                                  <button onClick={() => setGameSpeed(gameSpeed === 1 ? 2 : gameSpeed === 2 ? 4 : 1)} style={{ background: "#333", color: "#ddd", border: "1px solid #555", padding: "2px 8px", cursor: "pointer", fontFamily: "inherit", fontSize: "11px" }}>
                                    {gameSpeed}x
                                  </button>button>
                        </div>div>
                </div>div>
          
            {/* MAIN LAYOUT */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 260px", gap: "8px" }}>
                
                  {/* LEFT: MAP + LOG */}
                        <div>
                          {/* MAP */}
                                  <div style={{ background: "#0d0d1a", border: "1px solid #333", padding: "4px", fontSize: "14px", lineHeight: "16px", letterSpacing: "2px", overflowX: "auto", whiteSpace: "pre", marginBottom: "8px" }}>
                                    {renderedMap}
                                  </div>div>
                        
                          {/* GAME LOG */}
                                  <div ref={logRef} style={{ background: "#0d0d1a", border: "1px solid #333", padding: "6px", height: "140px", overflowY: "auto", fontSize: "11px" }}>
                                    {logs.map((log, i) => (
                          <div key={i} style={{ color: logColor[log.type] || "#888", marginBottom: "1px" }}>
                                          <span style={{ color: "#555" }}>[{new Date(log.timestamp).toLocaleTimeString()}]</span>span> {log.message}
                          </div>div>
                        ))}
                                  </div>div>
                        </div>div>
                
                  {/* RIGHT SIDEBAR */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        
                          {/* WORKER PANEL */}
                                  <div style={{ background: "#0d0d1a", border: "1px solid #333", padding: "8px" }}>
                                              <div style={{ fontWeight: "bold", color: "#ff8844", marginBottom: "6px", fontSize: "12px" }}>👥 WORKERS ({workers.length})</div>div>
                                    {workers.map((w) => (
                          <div
                                            key={w.id}
                                            onClick={() => setSelectedWorker(w.id === selectedWorker ? null : w.id)}
                                            style={{
                                                                padding: "4px", marginBottom: "3px", cursor: "pointer",
                                                                background: selectedWorker === w.id ? "#222244" : "#111122",
                                                                border: `1px solid ${selectedWorker === w.id ? "#4444aa" : "#222"}`,
                                                                fontSize: "11px",
                                            }}
                                          >
                                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                                                            <span>{w.emoji} <strong style={{ color: w.color }}>{w.name}</strong>strong></span>span>
                                                            <span style={{ color: statusColor[w.status] }}>{w.status}</span>span>
                                          </div>div>
                                          <div style={{ display: "flex", justifyContent: "space-between", color: "#666", fontSize: "10px" }}>
                                                            <span>HP:{w.health}/{w.maxHealth}</span>span>
                                                            <span>LVL:{w.level}</span>span>
                                                            <span>XP:{w.xp}</span>span>
                                          </div>div>
                            {w.job && (
                                                              <div style={{ marginTop: "2px" }}>
                                                                                  <div style={{ fontSize: "10px", color: "#aaa" }}>{w.job.label}</div>div>
                                                                                  <div style={{ background: "#111", height: "4px", borderRadius: "2px", overflow: "hidden" }}>
                                                                                                        <div style={{ background: "#44aaff", height: "100%", width: `${(w.job.progress / w.job.maxProgress) * 100}%`, transition: "width 0.3s" }} />
                                                                                    </div>div>
                                                              </div>div>
                                          )}
                          </div>div>
                        ))}
                                  </div>div>
                        
                          {/* SELECTED WORKER DETAIL */}
                          {selectedW && (
                        <div style={{ background: "#0d0d1a", border: "1px solid #4444aa", padding: "8px", fontSize: "11px" }}>
                                      <div style={{ fontWeight: "bold", color: selectedW.color, marginBottom: "4px" }}>{selectedW.emoji} {selectedW.name}</div>div>
                                      <div style={{ color: "#888", fontSize: "10px", marginBottom: "4px" }}>Origin: {selectedW.sourceWorkflow}</div>div>
                                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px", fontSize: "10px", color: "#aaa" }}>
                                                      <span>📁 Files: {selectedW.stats.filesProcessed}</span>span>
                                                      <span>🔀 Events: {selectedW.stats.eventsRouted}</span>span>
                                                      <span>📨 Messages: {selectedW.stats.messagesRelayed}</span>span>
                                                      <span>🔧 Fixes: {selectedW.stats.errorsFixed}</span>span>
                                      </div>div>
                        </div>div>
                                  )}
                        
                          {/* QUEST BOARD */}
                                  <div style={{ background: "#0d0d1a", border: "1px solid #333", padding: "8px", flex: 1, overflowY: "auto" }}>
                                              <div style={{ fontWeight: "bold", color: "#ff8844", marginBottom: "6px", fontSize: "12px" }}>📜 QUESTS ({activeQuests.length} active · {completedCount} done)</div>div>
                                    {activeQuests.slice(0, 6).map((q) => (
                          <div key={q.id} style={{ padding: "4px", marginBottom: "3px", background: "#111122", border: "1px solid #222", fontSize: "10px" }}>
                                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                                                            <span>{q.emoji} {q.title}</span>span>
                                                            <span style={{ color: priorityColor[q.priority] }}>{q.priority}</span>span>
                                          </div>div>
                                          <div style={{ color: "#666", display: "flex", justifyContent: "space-between" }}>
                                                            <span>{q.status === "active" ? "⏳ In Progress" : "🟢 Available"}</span>span>
                                                            <span>+{q.reward.xp}XP +{q.reward.gold}🪙</span>span>
                                          </div>div>
                          </div>div>
                        ))}
                                  </div>div>
                        
                        </div>div>
                </div>div>
          
            {/* FOOTER */}
                <div style={{ marginTop: "8px", borderTop: "1px solid #222", paddingTop: "4px", fontSize: "10px", color: "#444", display: "flex", justifyContent: "space-between" }}>
                        <span>WorkForge v0.1.0 — Salvaged from Pipedream · Powered by recycled $300 worth of workflow code</span>span>
                        <span>Workers source: event-router · dropbox-analyzer · ai-chat · slack-relay · cloud-sync</span>span>
                </div>div>
          </div>div>
        );
}</span>
