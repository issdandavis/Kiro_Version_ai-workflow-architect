/**
 * Main Entry Point v2.0
 * 
 * React application bootstrap with strict mode and root rendering.
 * 
 * @version 2.0.0
 */

import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Platform initialization
console.log("AI Workflow Platform v2.0 - Initializing...");

createRoot(document.getElementById("root")!).render(<App />);
