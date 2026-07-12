import type { NextConfig } from "next";
import { withEve } from "eve/next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default withEve(nextConfig, {
  eveBuildCommand: "npm run build:eve",
});
