import { defineCloudflareConfig } from "@opennextjs/cloudflare";
//import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";

export default defineCloudflareConfig({
  default: {
    runtime: "nodejs", // 必须设为 nodejs 以兼容你的 PG 驱动
  },
 // incrementalCache: r2IncrementalCache,
});
