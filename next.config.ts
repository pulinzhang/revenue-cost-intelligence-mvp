import type { NextConfig } from "next";
import { defineProxy } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  reactCompiler: true,
};

export default defineProxy(nextConfig, {
  external: true,
});
