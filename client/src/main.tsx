import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { registerServiceWorker } from "./pwa-utils";
import { setupOfflineSync, initOfflineDB } from "./lib/offline-db";

// Initialize offline database
initOfflineDB().then(() => {
  console.log("Offline database initialized");
}).catch(error => {
  console.error("Failed to initialize offline database:", error);
});

// Register service worker for PWA
registerServiceWorker();

// Setup offline/online sync
setupOfflineSync();

createRoot(document.getElementById("root")!).render(<App />);
