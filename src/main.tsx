import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Auto-redirect legacy hosts (lovable.app/dev, example.com, www subdomain) to canonical store.vsm.org.vn
(() => {
  const host = window.location.hostname;
  const legacy =
    /\.lovable\.(app|dev)$/i.test(host) ||
    /(^|\.)example\.com$/i.test(host) ||
    host === "www.store.vsm.org.vn";
  // Keep the live preview/sandbox usable for editing
  const isPreview = /id-preview--|sandbox\.lovable\./i.test(host);
  if (legacy && !isPreview) {
    window.location.replace(
      "https://store.vsm.org.vn" + window.location.pathname + window.location.search + window.location.hash
    );
    return;
  }
})();

createRoot(document.getElementById("root")!).render(<App />);
