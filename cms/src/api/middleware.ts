import type { Plugin } from "vite";
import { handleApiRequest } from "./routes";

/**
 * Vite plugin that intercepts /api/* requests and handles them server-side.
 * This gives us a single-process dev server with both the React UI and API.
 */
export function apiMiddleware(): Plugin {
  return {
    name: "cms-api-middleware",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url?.startsWith("/api/")) {
          try {
            const handled = await handleApiRequest(req, res);
            if (!handled) next();
          } catch (err) {
            console.error("[CMS API Error]", err);
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Internal server error" }));
          }
        } else {
          next();
        }
      });
    },
  };
}
