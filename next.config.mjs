import { createNextConfig } from '@cloudflare/next-onpages';

const nextConfig = createNextConfig({
  reactCompiler: true,
});

export default nextConfig;
