import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

/** App directory (folder that contains this config). Fixes wrong inferred root when a parent folder also has a lockfile — which can break Vercel output and surface as 404. */
const rootDir = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: rootDir,
  },
  outputFileTracingRoot: rootDir,
};

export default nextConfig;
