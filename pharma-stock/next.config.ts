import { NextConfig } from "next";

const nextConfig: NextConfig = {
  // expo-server-sdk pulls in undici, which uses private class fields (#field)
  // that Next's webpack bundling mangles when it tries to bundle it for the
  // server — producing a runtime "'super' keyword unexpected here" error in
  // the compiled chunk. Leaving it external makes Next `require()` it
  // natively from node_modules instead of bundling/transforming it.
  serverExternalPackages: ["expo-server-sdk", "undici"],
  webpack: (config) => {
    return config;
  },
};

export default nextConfig;
