import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { componentTaggerPlugin } from "./src/visual-edits/component-tagger-plugin.js";

// Minimal plugin to log build-time and dev-time errors to console
const logErrorsPlugin = () => ({
  name: "log-errors-plugin",
  transformIndexHtml() {
    return {
      tags: [
        {
          tag: "script",
          injectTo: "head",
          children: `(() => {
            try {
              const logOverlay = () => {
                const el = document.querySelector('vite-error-overlay');
                if (!el) return;
                const root = (el.shadowRoot || el);
                let text = '';
                try { text = root.textContent || ''; } catch (_) {}
                if (text && text.trim()) {
                  const msg = text.trim();
                  console.error('[Vite Overlay]', msg);
                  try {
                    if (window.parent && window.parent !== window) {
                      window.parent.postMessage({
                        type: 'ERROR_CAPTURED',
                        error: {
                          message: msg,
                          stack: undefined,
                          filename: undefined,
                          lineno: undefined,
                          colno: undefined,
                          source: 'vite.overlay',
                        },
                        timestamp: Date.now(),
                      }, '*');
                    }
                  } catch (_) {}
                }
              };

              const obs = new MutationObserver(() => logOverlay());
              obs.observe(document.documentElement, { childList: true, subtree: true });

              window.addEventListener('DOMContentLoaded', logOverlay);
              logOverlay();
            } catch (e) {
              console.warn('[Vite Overlay logger failed]', e);
            }
          })();`
        }
      ]
    };
  },
});

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 3000,
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
  plugins: [
    react(),
    logErrorsPlugin(),
    mode === 'development' && componentTaggerPlugin(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
}));
