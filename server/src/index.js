import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import fs from "fs";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";

import { startScheduler } from "./cron/scheduler.js";
import {
  ensureStorageDirectories,
  getDatabasePath,
  getStorageSummary,
  getUploadsRoot,
  hydrateStorageFromLegacy
} from "./config/storage.js";
import { initDatabase } from "./db/database.js";
import { runMigrations } from "./db/migrations.js";
import authRoutes from "./routes/auth.js";
import dashboardRoutes from "./routes/dashboard.js";
import blogRoutes from "./routes/blog.js";
import adminBlogRoutes from "./routes/adminBlog.js";
import seoRoutes from "./routes/seo.js";
import { renderBlogHtml } from "./services/ssr.js";
import { getJwtSecret } from "./utils/auth.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const app = express();
const PORT = Number(process.env.PORT || 3001);
const repoDistPath = path.resolve(__dirname, "../../dist");
const nginxDistPath = "/usr/share/nginx/html";
const frontendDistPath = fs.existsSync(repoDistPath)
  ? repoDistPath
  : fs.existsSync(nginxDistPath)
    ? nginxDistPath
    : null;
const cachedFrontendIndexHtml = frontendDistPath
  ? fs.readFileSync(path.join(frontendDistPath, "index.html"), "utf-8")
  : "";

ensureStorageDirectories();
hydrateStorageFromLegacy();

const storageSummary = getStorageSummary();
const db = initDatabase(getDatabasePath());
runMigrations(db);
app.locals.db = db;
app.locals.jwtSecret = getJwtSecret(db);

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  })
);
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    credentials: true
  })
);
app.use(compression());
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());
app.use(morgan("dev"));

app.use("/uploads", express.static(getUploadsRoot()));

app.use("/api/auth", authRoutes);
app.use("/api/dashboard/blog", adminBlogRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/blog", blogRoutes);
app.use("/", seoRoutes);

if (frontendDistPath) {
  app.use(
    express.static(frontendDistPath, {
      index: false
    })
  );

  app.get("*", async (req, res, next) => {
    if (req.path.startsWith("/api/") || req.path.startsWith("/uploads/")) {
      next();
      return;
    }

    // Blog pages get server-side SEO injection (title/meta/OG/JSON-LD + article
    // text) so they index and share correctly. Everything else gets the SPA shell.
    if (req.path.startsWith("/blog")) {
      try {
        const rendered = await renderBlogHtml(cachedFrontendIndexHtml, req.path);
        if (rendered) {
          res.type("html").send(rendered);
          return;
        }
      } catch (error) {
        console.error("[ssr] blog render failed:", error.message);
      }
    }

    res.type("html").send(cachedFrontendIndexHtml);
  });
}

startScheduler(db);

app.listen(PORT, () => {
  console.log(`[server] API running on http://localhost:${PORT}`);
  console.log(`[storage] DB: ${storageSummary.databasePath}`);
  console.log(`[storage] Uploads: ${storageSummary.uploadsRoot}`);
});
