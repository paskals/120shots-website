import type { IncomingMessage, ServerResponse } from "http";
import { ContentLoader } from "./content-loader";
import { ContentWriter } from "./content-writer";
import { deletePhotoFromR2 } from "./r2-operations";
import type { Essay } from "../types";

const loader = new ContentLoader();
const writer = new ContentWriter();

function json(res: ServerResponse, data: any, status = 200) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

function parseBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
  });
}

function getQueryParams(url: string): URLSearchParams {
  const qIndex = url.indexOf("?");
  return new URLSearchParams(qIndex >= 0 ? url.slice(qIndex + 1) : "");
}

export async function handleApiRequest(
  req: IncomingMessage,
  res: ServerResponse
): Promise<boolean> {
  const url = req.url || "";
  const method = req.method || "GET";

  if (!url.startsWith("/api/")) return false;

  const apiPath = url.split("?")[0].replace("/api/", "");

  try {
    // GET /api/photos
    if (method === "GET" && apiPath === "photos") {
      const params = getQueryParams(url);
      const photos = loader.getPhotos({
        roll: params.get("roll") || undefined,
        film: params.get("film") || undefined,
        camera: params.get("camera") || undefined,
        unused: params.get("unused") === "true",
        search: params.get("search") || undefined,
        includeHidden: params.get("includeHidden") === "true",
      });
      json(res, photos);
      return true;
    }

    // POST /api/photos/hide
    if (method === "POST" && apiPath === "photos/hide") {
      const body = await parseBody(req);
      const { rollId, sequence, hidden } = body;
      if (!rollId || !sequence || typeof hidden !== "boolean") {
        json(res, { error: "Missing rollId, sequence, or hidden" }, 400);
        return true;
      }
      writer.updateShotHidden(rollId, sequence, hidden);
      loader.reload();
      json(res, { rollId, sequence, hidden, updated: true });
      return true;
    }

    // DELETE /api/photos
    if (method === "DELETE" && apiPath === "photos") {
      const body = await parseBody(req);
      const { rollId, sequence, src } = body;
      if (!rollId || !sequence || !src) {
        json(res, { error: "Missing rollId, sequence, or src" }, 400);
        return true;
      }
      // Delete from R2 first - if this fails, YAML remains unchanged
      await deletePhotoFromR2(src);
      // Remove from YAML
      writer.removeShot(rollId, sequence);
      loader.reload();
      json(res, { rollId, sequence, deleted: true });
      return true;
    }

    // GET /api/rolls
    if (method === "GET" && apiPath === "rolls") {
      json(res, loader.getRolls());
      return true;
    }

    // GET /api/films
    if (method === "GET" && apiPath === "films") {
      json(res, loader.getFilms());
      return true;
    }

    // GET /api/cameras
    if (method === "GET" && apiPath === "cameras") {
      json(res, loader.getCameras());
      return true;
    }

    // GET /api/essays
    if (method === "GET" && apiPath === "essays") {
      loader.reload();
      json(res, loader.getEssays());
      return true;
    }

    // GET /api/essays/:id
    if (method === "GET" && apiPath.startsWith("essays/")) {
      const id = apiPath.replace("essays/", "");
      const essay = loader.getEssay(id);
      if (!essay) {
        json(res, { error: "Essay not found" }, 404);
      } else {
        json(res, essay);
      }
      return true;
    }

    // POST /api/essays
    if (method === "POST" && apiPath === "essays") {
      const body = await parseBody(req);
      const id = writer.createEssay(body);
      loader.reload();
      json(res, { id }, 201);
      return true;
    }

    // POST /api/essays/:id/rename
    if (method === "POST" && apiPath.match(/^essays\/[^/]+\/rename$/)) {
      const id = apiPath.replace("essays/", "").replace("/rename", "");
      const body = await parseBody(req);
      writer.renameEssay(id, body.newId);
      loader.reload();
      json(res, { oldId: id, newId: body.newId, renamed: true });
      return true;
    }

    // PUT /api/essays/:id
    if (method === "PUT" && apiPath.startsWith("essays/")) {
      const id = apiPath.replace("essays/", "");
      const body = await parseBody(req);
      const essay: Essay = { ...body, id };
      writer.saveEssay(essay);
      loader.reload();
      json(res, { id, saved: true });
      return true;
    }

    // GET /api/usage
    if (method === "GET" && apiPath === "usage") {
      json(res, loader.getUsage());
      return true;
    }

    // POST /api/reload
    if (method === "POST" && apiPath === "reload") {
      loader.reload();
      json(res, { reloaded: true });
      return true;
    }

    json(res, { error: "Not found" }, 404);
    return true;
  } catch (err: any) {
    json(res, { error: err.message }, 500);
    return true;
  }
}
