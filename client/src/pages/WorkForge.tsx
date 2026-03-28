import { useState, useEffect, useCallback, useRef, useMemo } from "react";

// ============================================================
// WORKFORGE - Gamified Workflow Automation Visualizer
// Salvaged from Pipedream project (RIP $300)
// Dwarf Fortress meets real automation output
// Now with Sacred Tongue integration, day/night cycle,
// synergy system, danger zones, and biome map
// ============================================================

// --- TYPES ---

type TileType = "ground" | "wall" | "water" | "forge" | "mine" | "portal" | "chest" | "tree" | "path" | "mountain" | "forest" | "danger";

type SacredTongue = "KO" | "AV" | "RU" | "CA" | "UM" | "DR";

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
    tongue: SacredTongue;
    tongueActivation: number; // 0-100
    abilities: WorkerAbility[];
    completionParticles: number; // countdown for particle effect
}

interface WorkerAbility {
    name: string;
    level: number; // level required
    description: string;
    active: boolean;
}

interface WorkerJob {
    type: "mine" | "craft" | "scout" | "relay" | "guard" | "heal";
    label: string;
    progress: number;
    maxProgress: number;
    reward: { xp: number; resource?: string; amount?: number; };
    tongue?: SacredTongue; // tongue affinity of the quest
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
    tongue: SacredTongue; // which tongue this quest resonates with
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
    type: "info" | "success" | "warning" | "error" | "quest" | "loot" | "tongue" | "danger";
}

interface BiomeWeather {
    name: string;
    emoji: string;
    effect: string;
    servicesUp: number;
    servicesTotal: number;
}

interface DangerZone {
    pos: Position;
    radius: number;
    ticksRemaining: number;
    damage: number;
}

// --- SACRED TONGUE SYSTEM ---
// KO=Intent, AV=Metadata, RU=Binding, CA=Compute, UM=Security, DR=Structure
// Phi-scaled weights: KO=1.00, AV=1.62, RU=2.62, CA=4.24, UM=6.85, DR=11.09

const TONGUE_CONFIG: Record<SacredTongue, { name: string; domain: string; color: string; weight: number; }> = {
    KO: { name: "KO", domain: "Intent",    color: "#ff6b6b", weight: 1.00 },
    AV: { name: "AV", domain: "Metadata",  color: "#ffd93d", weight: 1.62 },
    RU: { name: "RU", domain: "Binding",   color: "#6bcb77", weight: 2.62 },
    CA: { name: "CA", domain: "Compute",   color: "#4d96ff", weight: 4.24 },
    UM: { name: "UM", domain: "Security",  color: "#9b59b6", weight: 6.85 },
    DR: { name: "DR", domain: "Structure", color: "#e67e22", weight: 11.09 },
};

const QUEST_TONGUE_MAP: Record<Quest["category"], SacredTongue> = {
    code_changes: "KO",
    code_review: "DR",
    issue_management: "AV",
    release_management: "RU",
    ci_cd: "CA",
    security: "UM",
};

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
        code_changes: "\u2694\ufe0f", code_review: "\ud83d\udd0d", issue_management: "\ud83d\udccb",
        release_management: "\ud83d\ude80", ci_cd: "\u2699\ufe0f", security: "\ud83d\udee1\ufe0f",
    };
    return map[category] || "\u2753";
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

// Keep the analyzeResources function for potential API use
void categorizeFileType;

// --- DAY/NIGHT CYCLE ---

function getDayPhase(tick: number): { phase: "dawn" | "day" | "dusk" | "night"; icon: string; efficiency: number; overlay: string; } {
    const cycleLength = 200; // ticks per full day
    const pos = tick % cycleLength;
    const pct = pos / cycleLength;
    if (pct < 0.15) return { phase: "dawn", icon: "\ud83c\udf05", efficiency: 0.85, overlay: "rgba(255, 140, 50, 0.06)" };
    if (pct < 0.55) return { phase: "day", icon: "\u2600\ufe0f", efficiency: 1.0, overlay: "rgba(255, 255, 200, 0.02)" };
    if (pct < 0.70) return { phase: "dusk", icon: "\ud83c\udf07", efficiency: 0.80, overlay: "rgba(180, 80, 40, 0.08)" };
    return { phase: "night", icon: "\ud83c\udf19", efficiency: 0.55, overlay: "rgba(10, 10, 60, 0.15)" };
}

// --- SYNERGY CHECK ---

function getAdjacentWorkers(worker: WorkerEntity, allWorkers: WorkerEntity[]): WorkerEntity[] {
    return allWorkers.filter(w =>
        w.id !== worker.id &&
        Math.abs(w.pos.x - worker.pos.x) <= 1 &&
        Math.abs(w.pos.y - worker.pos.y) <= 1
    );
}

function getSynergyBonus(worker: WorkerEntity, allWorkers: WorkerEntity[]): number {
    const adjacent = getAdjacentWorkers(worker, allWorkers);
    if (adjacent.length === 0) return 1.0;
    // Each adjacent worker gives +20% bonus, different tongues give +30%
    let bonus = 1.0;
    for (const adj of adjacent) {
        bonus += adj.tongue !== worker.tongue ? 0.30 : 0.20;
    }
    return bonus;
}

// --- ABILITY SYSTEM ---

function getAbilitiesForLevel(level: number): WorkerAbility[] {
    const abilities: WorkerAbility[] = [];
    if (level >= 3) abilities.push({ name: "Swift", level: 3, description: "Speed boost: +25% work speed", active: true });
    if (level >= 5) abilities.push({ name: "Scholar", level: 5, description: "Double XP from completed quests", active: true });
    if (level >= 10) abilities.push({ name: "Beacon", level: 10, description: "Area effect: nearby workers gain +15% speed", active: true });
    return abilities;
}

function hasAbility(worker: WorkerEntity, name: string): boolean {
    return worker.abilities.some(a => a.name === name && a.active);
}

// --- MAP GENERATION (24x16 with biomes) ---

const MAP_W = 24;
const MAP_H = 16;

function generateMap(): TileType[][] {
    const map: TileType[][] = [];
    for (let y = 0; y < MAP_H; y++) {
        const row: TileType[] = [];
        for (let x = 0; x < MAP_W; x++) {
            // Border walls
            if (y === 0 || y === MAP_H - 1 || x === 0 || x === MAP_W - 1) {
                row.push("wall");
            }
            // Forest biome (top-left quadrant)
            else if (x >= 1 && x <= 10 && y >= 1 && y <= 6) {
                if (Math.random() < 0.35) row.push("forest");
                else if (Math.random() < 0.08) row.push("tree");
                else row.push("ground");
            }
            // Mountain biome (top-right)
            else if (x >= 14 && x <= 22 && y >= 1 && y <= 6) {
                if (Math.random() < 0.30) row.push("mountain");
                else if (Math.random() < 0.05) row.push("wall");
                else row.push("ground");
            }
            // Water biome (bottom-left lake)
            else if (x >= 2 && x <= 8 && y >= 10 && y <= 14) {
                if (Math.random() < 0.50) row.push("water");
                else row.push("ground");
            }
            // Forge district (bottom-right)
            else if (x >= 15 && x <= 22 && y >= 10 && y <= 14) {
                if (Math.random() < 0.10) row.push("forge");
                else row.push("ground");
            }
            // Default terrain
            else {
                if (Math.random() < 0.04) row.push("tree");
                else row.push("ground");
            }
        }
        map.push(row);
    }

    // Paths between key locations
    // Horizontal path across middle
    for (let x = 1; x < MAP_W - 1; x++) {
        if (map[7][x] === "ground" || map[7][x] === "forest") map[7][x] = "path";
        if (map[8][x] === "ground" || map[8][x] === "forest") map[8][x] = "path";
    }
    // Vertical path left side
    for (let y = 1; y < MAP_H - 1; y++) {
        if (map[y][11] === "ground" || map[y][11] === "forest" || map[y][11] === "mountain") map[y][11] = "path";
    }
    // Vertical path right side
    for (let y = 1; y < MAP_H - 1; y++) {
        if (map[y][14] === "ground" || map[y][14] === "mountain") map[y][14] = "path";
    }

    // Place key structures
    map[3][4] = "forge"; map[3][5] = "forge";
    map[12][18] = "mine"; map[12][19] = "mine"; map[13][18] = "mine";
    map[8][11] = "portal";
    map[2][8] = "chest"; map[5][20] = "chest"; map[13][5] = "chest";
    return map;
}

// --- TILE RENDERING (with gradients) ---

const TILE_CHARS: Record<TileType, { char: string; color: string; bg: string; bgAlt?: string; }> = {
    ground:   { char: "\u00b7", color: "#3a3a4a", bg: "#13131f", bgAlt: "#15152a" },
    wall:     { char: "\u2588", color: "#4a4a5a", bg: "#1a1a2e", bgAlt: "#1e1e35" },
    water:    { char: "\u2248", color: "#55aaff", bg: "#0a1533", bgAlt: "#0e1d44" },
    forge:    { char: "\u2668", color: "#ff6644", bg: "#331100", bgAlt: "#441800" },
    mine:     { char: "\u26cf", color: "#ccaa44", bg: "#222200", bgAlt: "#2a2a00" },
    portal:   { char: "\u25ce", color: "#cc66ff", bg: "#220044", bgAlt: "#330066" },
    chest:    { char: "\u25c6", color: "#ffcc00", bg: "#332200", bgAlt: "#443300" },
    tree:     { char: "\u2663", color: "#44aa44", bg: "#0a220a", bgAlt: "#0e2e0e" },
    path:     { char: "\u2591", color: "#5a5a6a", bg: "#1a1a28", bgAlt: "#1e1e30" },
    mountain: { char: "\u25b2", color: "#8888aa", bg: "#181828", bgAlt: "#1c1c33" },
    forest:   { char: "\u2660", color: "#338833", bg: "#081a08", bgAlt: "#0c240c" },
    danger:   { char: "\u2622", color: "#ff2222", bg: "#330000", bgAlt: "#440000" },
};

// --- INITIAL GAME STATE ---

function createInitialWorkers(): WorkerEntity[] {
    return [
        {
            id: "w1", name: "EventRouter", emoji: "\u26a1", pos: { x: 5, y: 4 }, targetPos: null,
            health: 100, maxHealth: 100, xp: 0, level: 1,
            job: null, status: "idle", color: "#44ff88",
            stats: { filesProcessed: 0, eventsRouted: 0, messagesRelayed: 0, errorsFixed: 0 },
            sourceWorkflow: "github-management-automation-hub",
            tongue: "KO", tongueActivation: 50, abilities: [], completionParticles: 0,
        },
        {
            id: "w2", name: "FileAnalyzer", emoji: "\ud83d\udd2c", pos: { x: 18, y: 12 }, targetPos: null,
            health: 85, maxHealth: 100, xp: 0, level: 1,
            job: null, status: "idle", color: "#44aaff",
            stats: { filesProcessed: 0, eventsRouted: 0, messagesRelayed: 0, errorsFixed: 0 },
            sourceWorkflow: "dropbox-organization-agent",
            tongue: "DR", tongueActivation: 50, abilities: [], completionParticles: 0,
        },
        {
            id: "w3", name: "AiOracle", emoji: "\ud83d\udd2e", pos: { x: 11, y: 8 }, targetPos: null,
            health: 90, maxHealth: 100, xp: 0, level: 1,
            job: null, status: "idle", color: "#ff88ff",
            stats: { filesProcessed: 0, eventsRouted: 0, messagesRelayed: 0, errorsFixed: 0 },
            sourceWorkflow: "claude-chatgpt-integration",
            tongue: "CA", tongueActivation: 50, abilities: [], completionParticles: 0,
        },
        {
            id: "w4", name: "SlackRelay", emoji: "\ud83d\udce1", pos: { x: 8, y: 3 }, targetPos: null,
            health: 95, maxHealth: 100, xp: 0, level: 1,
            job: null, status: "idle", color: "#ffaa44",
            stats: { filesProcessed: 0, eventsRouted: 0, messagesRelayed: 0, errorsFixed: 0 },
            sourceWorkflow: "ai-code-review-bot-for-slack",
            tongue: "AV", tongueActivation: 50, abilities: [], completionParticles: 0,
        },
        {
            id: "w5", name: "CloudSync", emoji: "\u2601\ufe0f", pos: { x: 20, y: 4 }, targetPos: null,
            health: 70, maxHealth: 100, xp: 0, level: 1,
            job: null, status: "idle", color: "#88ccff",
            stats: { filesProcessed: 0, eventsRouted: 0, messagesRelayed: 0, errorsFixed: 0 },
            sourceWorkflow: "ai-powered-dropbox-file-automation",
            tongue: "RU", tongueActivation: 50, abilities: [], completionParticles: 0,
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
        tongue: QUEST_TONGUE_MAP[category],
    };
}

// --- CSS KEYFRAMES (injected once) ---

const STYLE_ID = "workforge-styles";

function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
        @keyframes wf-pulse-forge {
            0%, 100% { text-shadow: 0 0 4px #ff6644, 0 0 8px #ff4422; }
            50% { text-shadow: 0 0 10px #ff8866, 0 0 20px #ff6644, 0 0 30px #ff4422; }
        }
        @keyframes wf-pulse-portal {
            0%, 100% { text-shadow: 0 0 4px #aa44ff, 0 0 8px #8822dd; }
            50% { text-shadow: 0 0 12px #cc66ff, 0 0 24px #aa44ff, 0 0 36px #8822dd; }
        }
        @keyframes wf-glow-active {
            0%, 100% { filter: brightness(1.0); }
            50% { filter: brightness(1.5); }
        }
        @keyframes wf-particle-burst {
            0% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.8; transform: scale(1.6); }
            100% { opacity: 0; transform: scale(2.2); }
        }
        @keyframes wf-danger-pulse {
            0%, 100% { background-color: rgba(255, 0, 0, 0.08); }
            50% { background-color: rgba(255, 0, 0, 0.25); }
        }
        .wf-particle {
            position: absolute;
            pointer-events: none;
            animation: wf-particle-burst 0.8s ease-out forwards;
            font-size: 10px;
        }
        .wf-tile-forge { animation: wf-pulse-forge 2s ease-in-out infinite; }
        .wf-tile-portal { animation: wf-pulse-portal 2.5s ease-in-out infinite; }
        .wf-worker-active { animation: wf-glow-active 1.2s ease-in-out infinite; }
        .wf-danger-zone { animation: wf-danger-pulse 1s ease-in-out infinite; }
        .wf-tongue-bar {
            height: 3px;
            border-radius: 1px;
            transition: width 0.3s ease;
        }
        .wf-health-bar-outer {
            background: #111;
            height: 5px;
            border-radius: 2px;
            overflow: hidden;
            width: 100%;
        }
        .wf-health-bar-inner {
            height: 100%;
            border-radius: 2px;
            transition: width 0.3s ease;
        }
    `;
    document.head.appendChild(style);
}

// --- HEALTH BAR COLOR ---

function healthGradient(pct: number): string {
    if (pct > 0.6) return `linear-gradient(90deg, #22cc44, #88ee44)`;
    if (pct > 0.3) return `linear-gradient(90deg, #ccaa22, #eecc22)`;
    return `linear-gradient(90deg, #cc2222, #ee4422)`;
}

// --- MAIN COMPONENT ---

export default function WorkForge() {
    const [map] = useState<TileType[][]>(() => generateMap());
    const [workers, setWorkers] = useState<WorkerEntity[]>(() => createInitialWorkers());
    const [quests, setQuests] = useState<Quest[]>(() => [generateQuest(), generateQuest(), generateQuest()]);
    const [resources, setResources] = useState<Resource[]>([
        { name: "documents", emoji: "\ud83d\udcdc", amount: 12, category: "documents" },
        { name: "code", emoji: "\ud83d\udc8e", amount: 34, category: "code" },
        { name: "images", emoji: "\ud83d\uddbc\ufe0f", amount: 8, category: "images" },
        { name: "data", emoji: "\ud83d\udcca", amount: 21, category: "data" },
        { name: "messages", emoji: "\u2709\ufe0f", amount: 15, category: "messages" },
        { name: "gold", emoji: "\ud83e\ude99", amount: 100, category: "gold" },
    ]);
    const [logs, setLogs] = useState<GameLog[]>([
        { timestamp: Date.now(), message: "\u2692\ufe0f WorkForge initialized. Colony awakens.", type: "info" },
        { timestamp: Date.now(), message: "\ud83d\uddfa\ufe0f Map generated (24x16). 5 Sacred Tongue workers reporting.", type: "info" },
        { timestamp: Date.now(), message: "\ud83d\udce6 Salvaged code from Pipedream (RIP $300) loaded.", type: "success" },
        { timestamp: Date.now(), message: "\ud83d\udd2e Sacred Tongues online: KO \u00b7 AV \u00b7 RU \u00b7 CA \u00b7 UM \u00b7 DR", type: "tongue" },
    ]);
    const [weather, setWeather] = useState<BiomeWeather>({ name: "Clear Skies", emoji: "\u2600\ufe0f", effect: "+10% work speed", servicesUp: 5, servicesTotal: 6 });
    const [tick, setTick] = useState(0);
    const [selectedWorker, setSelectedWorker] = useState<string | null>(null);
    const [isPaused, setIsPaused] = useState(false);
    const [gameSpeed, setGameSpeed] = useState(1);
    const [dangerZones, setDangerZones] = useState<DangerZone[]>([]);
    const logRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<HTMLDivElement>(null);

    // Inject CSS on mount
    useEffect(() => { injectStyles(); }, []);

    const dayPhase = getDayPhase(tick);

    const addLog = useCallback((message: string, type: GameLog["type"] = "info") => {
        setLogs((prev) => [...prev.slice(-50), { timestamp: Date.now(), message, type }]);
    }, []);

    // --- Spawn particle effect ---
    const spawnParticles = useCallback((_emoji: string, x: number, y: number) => {
        if (!mapRef.current) return;
        const particles = ["\u2728", "\u2b50", "\ud83d\udcab", "\u2705"];
        for (let i = 0; i < 4; i++) {
            const el = document.createElement("span");
            el.className = "wf-particle";
            el.textContent = particles[i % particles.length];
            const offsetX = (Math.random() - 0.5) * 30;
            const offsetY = (Math.random() - 0.5) * 30;
            el.style.left = `${x * 14 + offsetX}px`;
            el.style.top = `${y * 16 + offsetY}px`;
            mapRef.current.appendChild(el);
            setTimeout(() => el.remove(), 800);
        }
    }, []);

    // --- GAME LOOP ---
    useEffect(() => {
        if (isPaused) return;
        const interval = setInterval(() => {
            setTick((t) => t + 1);

            // --- Danger zone lifecycle ---
            setDangerZones((prev) => {
                let zones = prev.map(z => ({ ...z, ticksRemaining: z.ticksRemaining - 1 })).filter(z => z.ticksRemaining > 0);
                // Spawn new danger zone randomly
                if (Math.random() < 0.015 && zones.length < 3) {
                    const nx = Math.floor(Math.random() * (MAP_W - 4)) + 2;
                    const ny = Math.floor(Math.random() * (MAP_H - 4)) + 2;
                    zones = [...zones, { pos: { x: nx, y: ny }, radius: 2, ticksRemaining: 25 + Math.floor(Math.random() * 20), damage: 8 }];
                    addLog(`\u2622\ufe0f DANGER ZONE appeared at (${nx}, ${ny})! Workers beware!`, "danger");
                }
                return zones;
            });

            // Move workers toward targets + handle game systems
            setWorkers((prev) => {
                // Snapshot danger zones for this tick
                let currentDangerZones: DangerZone[] = [];
                setDangerZones((zones) => { currentDangerZones = zones; return zones; });

                return prev.map((w) => {
                    const worker = { ...w };

                    // Decrement particles
                    if (worker.completionParticles > 0) {
                        worker.completionParticles -= 1;
                    }

                    // Update abilities based on level
                    worker.abilities = getAbilitiesForLevel(worker.level);

                    // Danger zone damage
                    for (const zone of currentDangerZones) {
                        const dist = Math.abs(worker.pos.x - zone.pos.x) + Math.abs(worker.pos.y - zone.pos.y);
                        if (dist <= zone.radius) {
                            worker.health = Math.max(0, worker.health - zone.damage);
                            if (Math.random() < 0.1) {
                                addLog(`\u26a0\ufe0f ${worker.emoji} ${worker.name} took ${zone.damage} damage from danger zone!`, "danger");
                            }
                        }
                    }

                    // Error recovery
                    if (worker.status === "error") {
                        if (Math.random() < 0.1) return { ...worker, status: "idle" as const, health: Math.min(worker.maxHealth, worker.health + 10) };
                        return worker;
                    }

                    // Working on job
                    if (worker.job) {
                        // Calculate effective speed with all bonuses
                        const synergyMult = getSynergyBonus(worker, prev);
                        const swiftMult = hasAbility(worker, "Swift") ? 1.25 : 1.0;
                        const beaconNearby = prev.some(other =>
                            other.id !== worker.id &&
                            hasAbility(other, "Beacon") &&
                            Math.abs(other.pos.x - worker.pos.x) <= 2 &&
                            Math.abs(other.pos.y - worker.pos.y) <= 2
                        );
                        const beaconMult = beaconNearby ? 1.15 : 1.0;
                        const tongueMatch = worker.job.tongue === worker.tongue ? 1.35 : 1.0;

                        const speed = dayPhase.efficiency * synergyMult * swiftMult * beaconMult * tongueMatch;
                        const progressChance = Math.min(0.95, 0.7 * speed);
                        const newProgress = worker.job.progress + (Math.random() < progressChance ? 1 : 0);

                        // Tongue activation increases while working
                        const newActivation = Math.min(100, worker.tongueActivation + (tongueMatch > 1 ? 3 : 1));

                        if (newProgress >= worker.job.maxProgress) {
                            // Job complete!
                            const xpMult = hasAbility(worker, "Scholar") ? 2.0 : 1.0;
                            const newXp = worker.xp + Math.floor(worker.job.reward.xp * xpMult);
                            const newLevel = Math.floor(newXp / 100) + 1;
                            const leveledUp = newLevel > worker.level;
                            addLog(`\u2705 ${worker.emoji} ${worker.name} completed: ${worker.job.label} (+${Math.floor(worker.job.reward.xp * xpMult)} XP)${tongueMatch > 1 ? " [" + worker.tongue + " resonance]" : ""}`, "success");
                            if (leveledUp) {
                                addLog(`\u2b50 ${worker.emoji} ${worker.name} reached LEVEL ${newLevel}!${newLevel === 3 ? " Gained: Swift" : newLevel === 5 ? " Gained: Scholar" : newLevel === 10 ? " Gained: Beacon" : ""}`, "success");
                            }
                            if (worker.job.reward.resource) {
                                setResources((r) => r.map((res) => res.category === worker.job!.reward.resource ? { ...res, amount: res.amount + (worker.job!.reward.amount || 1) } : res));
                            }
                            const stat = worker.job.type === "mine" ? "filesProcessed" : worker.job.type === "scout" ? "eventsRouted" : worker.job.type === "relay" ? "messagesRelayed" : "errorsFixed";
                            spawnParticles(worker.emoji, worker.pos.x, worker.pos.y);
                            return { ...worker, job: null, status: "idle" as const, xp: newXp, level: newLevel, abilities: getAbilitiesForLevel(newLevel), stats: { ...worker.stats, [stat]: worker.stats[stat] + 1 }, tongueActivation: newActivation, completionParticles: 5 };
                        }
                        return { ...worker, job: { ...worker.job, progress: newProgress }, status: "working" as const, tongueActivation: newActivation };
                    }

                    // Random movement when idle (avoid danger zones)
                    if (worker.status === "idle" && Math.random() < 0.3) {
                        const dx = Math.floor(Math.random() * 3) - 1;
                        const dy = Math.floor(Math.random() * 3) - 1;
                        const nx = Math.max(1, Math.min(MAP_W - 2, worker.pos.x + dx));
                        const ny = Math.max(1, Math.min(MAP_H - 2, worker.pos.y + dy));
                        if (map[ny][nx] !== "wall" && map[ny][nx] !== "water") {
                            // Check danger zones -- workers flee if possible
                            let inDanger = false;
                            for (const zone of currentDangerZones) {
                                const dist = Math.abs(nx - zone.pos.x) + Math.abs(ny - zone.pos.y);
                                if (dist <= zone.radius) inDanger = true;
                            }
                            if (!inDanger || Math.random() < 0.2) {
                                return { ...worker, pos: { x: nx, y: ny } };
                            }
                        }
                    }

                    // Tongue activation slowly decays when idle
                    if (worker.status === "idle") {
                        worker.tongueActivation = Math.max(20, worker.tongueActivation - 0.5);
                    }

                    return worker;
                });
            });

            // Random events
            if (Math.random() < 0.05) {
                setQuests((prev) => {
                    if (prev.filter((q) => q.status === "available").length < 5) {
                        const newQ = generateQuest();
                        addLog(`${newQ.emoji} New quest: "${newQ.title}" [${newQ.priority.toUpperCase()}] {${newQ.tongue}}`, "quest");
                        return [...prev, newQ];
                    }
                    return prev;
                });
            }

            // Auto-assign idle workers to quests (tongue-aware matching)
            setWorkers((prev) => {
                const idle = prev.filter((w) => w.status === "idle" && !w.job);
                if (idle.length === 0) return prev;
                const worker = idle[Math.floor(Math.random() * idle.length)];
                const availableQuests = quests.filter((q) => q.status === "available");
                if (availableQuests.length === 0) return prev;

                if (Math.random() < 0.15) {
                    // Prefer tongue-matching quests
                    const matching = availableQuests.filter(q => q.tongue === worker.tongue);
                    const quest = matching.length > 0 && Math.random() < 0.7 ? matching[0] : availableQuests[0];
                    setQuests((qprev) => qprev.map((q) => q.id === quest.id ? { ...q, status: "active" as const, assignedWorker: worker.id } : q));
                    const jobTypes: WorkerJob["type"][] = ["mine", "craft", "scout", "relay", "guard", "heal"];
                    const jobType = jobTypes[Math.floor(Math.random() * jobTypes.length)];
                    const tongueMatch = quest.tongue === worker.tongue;
                    addLog(`${worker.emoji} ${worker.name} takes quest: "${quest.title}"${tongueMatch ? " [" + worker.tongue + " MATCH]" : ""}`, "info");
                    return prev.map((w) => w.id === worker.id ? {
                        ...w, status: "working" as const,
                        job: { type: jobType, label: quest.title, progress: 0, maxProgress: 8 + Math.floor(Math.random() * 12), reward: { xp: quest.reward.xp, resource: "code", amount: Math.floor(Math.random() * 3) + 1 }, tongue: quest.tongue },
                    } : w);
                }
                return prev;
            });

            // Weather changes
            if (Math.random() < 0.02) {
                const weathers: BiomeWeather[] = [
                    { name: "Clear Skies", emoji: "\u2600\ufe0f", effect: "+10% work speed", servicesUp: 6, servicesTotal: 6 },
                    { name: "API Storm", emoji: "\u26c8\ufe0f", effect: "-20% reliability", servicesUp: 4, servicesTotal: 6 },
                    { name: "Rate Limit Fog", emoji: "\ud83c\udf2b\ufe0f", effect: "Slower responses", servicesUp: 5, servicesTotal: 6 },
                    { name: "Deploy Winds", emoji: "\ud83c\udf2a\ufe0f", effect: "Fast but risky", servicesUp: 5, servicesTotal: 6 },
                    { name: "Golden Hour", emoji: "\ud83c\udf05", effect: "+25% XP gains", servicesUp: 6, servicesTotal: 6 },
                    { name: "Downtime Eclipse", emoji: "\ud83c\udf11", effect: "Service outage!", servicesUp: 2, servicesTotal: 6 },
                ];
                const newWeather = weathers[Math.floor(Math.random() * weathers.length)];
                setWeather(newWeather);
                addLog(`${newWeather.emoji} Weather: ${newWeather.name} \u2014 ${newWeather.effect}`, newWeather.servicesUp < 4 ? "warning" : "info");
            }

            // Random worker errors
            if (Math.random() < 0.02) {
                setWorkers((prev) => {
                    const working = prev.filter((w) => w.status === "working");
                    if (working.length === 0) return prev;
                    const unlucky = working[Math.floor(Math.random() * working.length)];
                    addLog(`\ud83d\udca5 ${unlucky.emoji} ${unlucky.name} encountered an error!`, "error");
                    return prev.map((w) => w.id === unlucky.id ? { ...w, status: "error" as const, health: Math.max(0, w.health - 15), job: null } : w);
                });
            }

            // Complete active quests when workers finish
            setQuests((prev) => prev.map((q) => {
                if (q.status === "active" && q.assignedWorker) {
                    const worker = workers.find((w) => w.id === q.assignedWorker);
                    if (worker && !worker.job && worker.status === "idle") {
                        setResources((r) => r.map((res) => res.category === "gold" ? { ...res, amount: res.amount + q.reward.gold } : res));
                        addLog(`\ud83c\udfc6 Quest complete: "${q.title}" (+${q.reward.gold} \ud83e\ude99)`, "loot");
                        return { ...q, status: "completed" as const };
                    }
                }
                return q;
            }));

        }, 800 / gameSpeed);
        return () => clearInterval(interval);
    }, [isPaused, gameSpeed, map, quests, workers, addLog, dayPhase.efficiency, spawnParticles]);

    // Auto-scroll log
    useEffect(() => { logRef.current?.scrollTo(0, logRef.current.scrollHeight); }, [logs]);

    // --- Build danger zone lookup set ---
    const dangerTiles = useMemo(() => {
        const set = new Set<string>();
        for (const zone of dangerZones) {
            for (let dy = -zone.radius; dy <= zone.radius; dy++) {
                for (let dx = -zone.radius; dx <= zone.radius; dx++) {
                    if (Math.abs(dx) + Math.abs(dy) <= zone.radius) {
                        set.add(`${zone.pos.x + dx},${zone.pos.y + dy}`);
                    }
                }
            }
        }
        return set;
    }, [dangerZones]);

    // --- RENDER MAP ---
    const renderedMap = useMemo(() => {
        const cells: JSX.Element[] = [];
        for (let y = 0; y < MAP_H; y++) {
            for (let x = 0; x < MAP_W; x++) {
                const worker = workers.find((w) => w.pos.x === x && w.pos.y === y);
                const tileType = map[y][x];
                const tile = TILE_CHARS[tileType];
                const isSelected = worker && selectedWorker === worker.id;
                const isDanger = dangerTiles.has(`${x},${y}`);
                const isForge = tileType === "forge";
                const isPortal = tileType === "portal";

                // Tile gradient: alternate bg color based on position for checkerboard feel
                const useBgAlt = (x + y) % 2 === 0 && tile.bgAlt;
                const baseBg = useBgAlt ? tile.bgAlt! : tile.bg;

                let className = "";
                if (isForge && !worker) className = "wf-tile-forge";
                if (isPortal && !worker) className = "wf-tile-portal";
                if (worker && worker.status === "working") className = "wf-worker-active";
                if (isDanger && !worker) className = "wf-danger-zone";

                cells.push(
                    <span
                        key={`${x}-${y}`}
                        className={className}
                        onClick={() => worker && setSelectedWorker(worker.id)}
                        style={{
                            color: worker ? worker.color : tile.color,
                            backgroundColor: isDanger && !worker ? "rgba(255, 0, 0, 0.15)" : isSelected ? "#443366" : worker ? "#222244" : baseBg,
                            cursor: worker ? "pointer" : "default",
                            fontWeight: worker ? "bold" : "normal",
                            textShadow: worker
                                ? `0 0 8px ${worker.color}, 0 0 16px ${worker.color}40`
                                : "none",
                            transition: "all 0.15s",
                            position: "relative" as const,
                        }}
                        title={worker ? `${worker.emoji} ${worker.name} [${worker.status}] HP:${worker.health} LVL:${worker.level} ${worker.tongue}` : `${tileType}${isDanger ? " [DANGER]" : ""}`}
                    >
                        {worker ? (worker.completionParticles > 0 ? "\u2728" : worker.emoji) : tile.char}
                    </span>
                );
            }
            cells.push(<br key={`br-${y}`} />);
        }
        return cells;
    }, [map, workers, selectedWorker, dangerTiles]);

    const selectedW = workers.find((w) => w.id === selectedWorker);
    const activeQuests = quests.filter((q) => q.status === "available" || q.status === "active");
    const completedCount = quests.filter((q) => q.status === "completed").length;

    const priorityColor: Record<string, string> = { critical: "#ff4444", high: "#ff8844", medium: "#ffcc44", low: "#88cc88" };
    const statusColor: Record<string, string> = { idle: "#88cc88", working: "#44aaff", moving: "#cccc44", resting: "#aa88cc", error: "#ff4444" };
    const logColor: Record<string, string> = { info: "#8888aa", success: "#44cc66", warning: "#ccaa44", error: "#ff4444", quest: "#aa88ff", loot: "#ffcc44", tongue: "#ff6b6b", danger: "#ff2222" };

    return (
        <div style={{ background: "#0a0a14", color: "#ccccdd", minHeight: "100vh", fontFamily: "'Courier New', monospace", padding: "8px" }}>
            {/* HEADER BAR */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #333", paddingBottom: "6px", marginBottom: "8px", flexWrap: "wrap", gap: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontSize: "20px", fontWeight: "bold", color: "#ff8844" }}>{"\u2692\ufe0f"} WORKFORGE</span>
                    <span style={{ fontSize: "11px", color: "#666" }}>Tick: {tick}</span>
                    <span style={{ fontSize: "11px", color: "#888" }}>{weather.emoji} {weather.name}</span>
                    <span style={{ fontSize: "11px", color: weather.servicesUp < 4 ? "#ff4444" : "#44cc66" }}>
                        [{weather.servicesUp}/{weather.servicesTotal} services]
                    </span>
                    <span style={{ fontSize: "11px", color: dayPhase.phase === "night" ? "#6666aa" : dayPhase.phase === "dawn" ? "#ffaa66" : dayPhase.phase === "dusk" ? "#cc8844" : "#dddd88" }}>
                        {dayPhase.icon} {dayPhase.phase.toUpperCase()} ({Math.round(dayPhase.efficiency * 100)}%)
                    </span>
                    {dangerZones.length > 0 && (
                        <span style={{ fontSize: "11px", color: "#ff2222", fontWeight: "bold" }}>
                            {"\u2622\ufe0f"} {dangerZones.length} DANGER
                        </span>
                    )}
                </div>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    {resources.map((r) => (
                        <span key={r.name} style={{ fontSize: "11px", color: "#aaa" }} title={r.name}>
                            {r.emoji}{r.amount}
                        </span>
                    ))}
                    <span style={{ margin: "0 4px", color: "#333" }}>|</span>
                    <button onClick={() => setIsPaused(!isPaused)} style={{ background: isPaused ? "#446644" : "#664444", color: "#ddd", border: "1px solid #555", padding: "2px 8px", cursor: "pointer", fontFamily: "inherit", fontSize: "11px" }}>
                        {isPaused ? "\u25b6 PLAY" : "\u23f8 PAUSE"}
                    </button>
                    <button onClick={() => setGameSpeed(gameSpeed === 1 ? 2 : gameSpeed === 2 ? 4 : 1)} style={{ background: "#333", color: "#ddd", border: "1px solid #555", padding: "2px 8px", cursor: "pointer", fontFamily: "inherit", fontSize: "11px" }}>
                        {gameSpeed}x
                    </button>
                </div>
            </div>

            {/* MAIN LAYOUT */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: "8px" }}>

                {/* LEFT: MAP + LOG */}
                <div>
                    {/* MAP */}
                    <div
                        ref={mapRef}
                        style={{
                            background: "#0d0d1a",
                            border: "1px solid #333",
                            padding: "4px",
                            fontSize: "14px",
                            lineHeight: "16px",
                            letterSpacing: "2px",
                            overflowX: "auto",
                            whiteSpace: "pre",
                            marginBottom: "8px",
                            position: "relative",
                            boxShadow: `inset 0 0 80px ${dayPhase.overlay}`,
                        }}
                    >
                        {renderedMap}
                    </div>

                    {/* SACRED TONGUE LEGEND */}
                    <div style={{ display: "flex", gap: "6px", marginBottom: "8px", flexWrap: "wrap" }}>
                        {Object.entries(TONGUE_CONFIG).map(([key, cfg]) => (
                            <span key={key} style={{ fontSize: "10px", padding: "2px 6px", background: "#111122", border: `1px solid ${cfg.color}40`, borderRadius: "3px", color: cfg.color }}>
                                {cfg.name}: {cfg.domain} (x{cfg.weight.toFixed(2)})
                            </span>
                        ))}
                    </div>

                    {/* GAME LOG */}
                    <div ref={logRef} style={{ background: "#0d0d1a", border: "1px solid #333", padding: "6px", height: "140px", overflowY: "auto", fontSize: "11px" }}>
                        {logs.map((log, i) => (
                            <div key={i} style={{ color: logColor[log.type] || "#888", marginBottom: "1px" }}>
                                <span style={{ color: "#555" }}>[{new Date(log.timestamp).toLocaleTimeString()}]</span> {log.message}
                            </div>
                        ))}
                    </div>
                </div>

                {/* RIGHT SIDEBAR */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>

                    {/* WORKER PANEL */}
                    <div style={{ background: "#0d0d1a", border: "1px solid #333", padding: "8px" }}>
                        <div style={{ fontWeight: "bold", color: "#ff8844", marginBottom: "6px", fontSize: "12px" }}>{"\ud83d\udc65"} WORKERS ({workers.length})</div>
                        {workers.map((w) => {
                            const synergy = getSynergyBonus(w, workers);
                            const hpPct = w.health / w.maxHealth;
                            const tc = TONGUE_CONFIG[w.tongue];
                            return (
                                <div
                                    key={w.id}
                                    onClick={() => setSelectedWorker(w.id === selectedWorker ? null : w.id)}
                                    style={{
                                        padding: "4px", marginBottom: "4px", cursor: "pointer",
                                        background: selectedWorker === w.id ? "#222244" : "#111122",
                                        border: `1px solid ${selectedWorker === w.id ? "#4444aa" : "#222"}`,
                                        fontSize: "11px",
                                        borderLeft: `3px solid ${tc.color}`,
                                    }}
                                >
                                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                                        <span>{w.emoji} <strong style={{ color: w.color }}>{w.name}</strong></span>
                                        <span style={{ color: statusColor[w.status] }}>{w.status}{synergy > 1 ? ` x${synergy.toFixed(1)}` : ""}</span>
                                    </div>
                                    {/* Health bar with gradient */}
                                    <div className="wf-health-bar-outer" style={{ marginTop: "2px" }}>
                                        <div className="wf-health-bar-inner" style={{ width: `${hpPct * 100}%`, background: healthGradient(hpPct) }} />
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", color: "#666", fontSize: "10px", marginTop: "1px" }}>
                                        <span>HP:{w.health}/{w.maxHealth}</span>
                                        <span>LVL:{w.level}</span>
                                        <span>XP:{w.xp}</span>
                                    </div>
                                    {/* Tongue activation bar */}
                                    <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "2px" }}>
                                        <span style={{ fontSize: "9px", color: tc.color, fontWeight: "bold", width: "18px" }}>{tc.name}</span>
                                        <div style={{ flex: 1, background: "#0a0a15", height: "3px", borderRadius: "1px" }}>
                                            <div className="wf-tongue-bar" style={{ width: `${w.tongueActivation}%`, background: `linear-gradient(90deg, ${tc.color}88, ${tc.color})` }} />
                                        </div>
                                        <span style={{ fontSize: "8px", color: "#555" }}>{Math.round(w.tongueActivation)}%</span>
                                    </div>
                                    {/* Ability badges */}
                                    {w.abilities.length > 0 && (
                                        <div style={{ display: "flex", gap: "3px", marginTop: "2px" }}>
                                            {w.abilities.map(a => (
                                                <span key={a.name} style={{ fontSize: "8px", padding: "0 3px", background: "#222244", border: "1px solid #444488", borderRadius: "2px", color: "#aabbff" }} title={a.description}>
                                                    {a.name}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    {w.job && (
                                        <div style={{ marginTop: "2px" }}>
                                            <div style={{ fontSize: "10px", color: "#aaa" }}>{w.job.label} {w.job.tongue ? `[${w.job.tongue}]` : ""}</div>
                                            <div style={{ background: "#111", height: "4px", borderRadius: "2px", overflow: "hidden" }}>
                                                <div style={{ background: w.job.tongue === w.tongue ? `linear-gradient(90deg, ${tc.color}, #44aaff)` : "#44aaff", height: "100%", width: `${(w.job.progress / w.job.maxProgress) * 100}%`, transition: "width 0.3s" }} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* SELECTED WORKER DETAIL */}
                    {selectedW && (
                        <div style={{ background: "#0d0d1a", border: `1px solid ${TONGUE_CONFIG[selectedW.tongue].color}`, padding: "8px", fontSize: "11px" }}>
                            <div style={{ fontWeight: "bold", color: selectedW.color, marginBottom: "4px" }}>{selectedW.emoji} {selectedW.name}</div>
                            <div style={{ color: TONGUE_CONFIG[selectedW.tongue].color, fontSize: "10px", marginBottom: "2px" }}>
                                Tongue: {selectedW.tongue} ({TONGUE_CONFIG[selectedW.tongue].domain}) | Weight: x{TONGUE_CONFIG[selectedW.tongue].weight.toFixed(2)}
                            </div>
                            <div style={{ color: "#888", fontSize: "10px", marginBottom: "4px" }}>Origin: {selectedW.sourceWorkflow}</div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px", fontSize: "10px", color: "#aaa" }}>
                                <span>{"\ud83d\udcc1"} Files: {selectedW.stats.filesProcessed}</span>
                                <span>{"\ud83d\udd00"} Events: {selectedW.stats.eventsRouted}</span>
                                <span>{"\ud83d\udce8"} Messages: {selectedW.stats.messagesRelayed}</span>
                                <span>{"\ud83d\udd27"} Fixes: {selectedW.stats.errorsFixed}</span>
                            </div>
                            {selectedW.abilities.length > 0 && (
                                <div style={{ marginTop: "4px", borderTop: "1px solid #222", paddingTop: "3px" }}>
                                    <div style={{ fontSize: "10px", color: "#aabbff", fontWeight: "bold" }}>Abilities:</div>
                                    {selectedW.abilities.map(a => (
                                        <div key={a.name} style={{ fontSize: "9px", color: "#8899cc" }}>L{a.level}: {a.name} - {a.description}</div>
                                    ))}
                                </div>
                            )}
                            {getAdjacentWorkers(selectedW, workers).length > 0 && (
                                <div style={{ marginTop: "4px", fontSize: "9px", color: "#66cc88" }}>
                                    Synergy: x{getSynergyBonus(selectedW, workers).toFixed(2)} ({getAdjacentWorkers(selectedW, workers).map(w => w.name).join(", ")})
                                </div>
                            )}
                        </div>
                    )}

                    {/* QUEST BOARD */}
                    <div style={{ background: "#0d0d1a", border: "1px solid #333", padding: "8px", flex: 1, overflowY: "auto" }}>
                        <div style={{ fontWeight: "bold", color: "#ff8844", marginBottom: "6px", fontSize: "12px" }}>{"\ud83d\udcdc"} QUESTS ({activeQuests.length} active {"\u00b7"} {completedCount} done)</div>
                        {activeQuests.slice(0, 6).map((q) => (
                            <div key={q.id} style={{ padding: "4px", marginBottom: "3px", background: "#111122", border: "1px solid #222", fontSize: "10px", borderLeft: `3px solid ${TONGUE_CONFIG[q.tongue].color}` }}>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <span>{q.emoji} {q.title}</span>
                                    <span style={{ color: priorityColor[q.priority] }}>{q.priority}</span>
                                </div>
                                <div style={{ color: "#666", display: "flex", justifyContent: "space-between" }}>
                                    <span>{q.status === "active" ? "\u23f3 In Progress" : "\ud83d\udfe2 Available"} <span style={{ color: TONGUE_CONFIG[q.tongue].color }}>[{q.tongue}]</span></span>
                                    <span>+{q.reward.xp}XP +{q.reward.gold}{"\ud83e\ude99"}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                </div>
            </div>

            {/* FOOTER */}
            <div style={{ marginTop: "8px", borderTop: "1px solid #222", paddingTop: "4px", fontSize: "10px", color: "#444", display: "flex", justifyContent: "space-between" }}>
                <span>WorkForge v0.2.0 {"\u2014"} Sacred Tongue Edition {"\u00b7"} Salvaged from Pipedream {"\u00b7"} 6 Tongues {"\u00b7"} Day/Night {"\u00b7"} Synergy {"\u00b7"} Danger Zones</span>
                <span>KO:Intent {"\u00b7"} AV:Metadata {"\u00b7"} RU:Binding {"\u00b7"} CA:Compute {"\u00b7"} UM:Security {"\u00b7"} DR:Structure</span>
            </div>
        </div>
    );
}
