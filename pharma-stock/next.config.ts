import { NextConfig } from "next";

const nextConfig: NextConfig = {
  // expo-server-sdk pulls in undici, which uses private class fields (#field)
  // that Next's webpack bundling mangles when it tries to bundle it for the
  // server — producing a runtime "'super' keyword unexpected here" error in
  // the compiled chunk. Leaving it external makes Next `require()` it
  // natively from node_modules instead of bundling/transforming it.
  serverExternalPackages: ["expo-server-sdk", "undici"],
  async headers() {
    return [
      {
        // robots.txt no longer blanket-disallows /api, so that Googlebot's
        // renderer can fetch the public endpoints our pages depend on. This
        // keeps the raw JSON crawlable but out of the index.
        source: "/api/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex" }],
      },
      {
        // Single-use token landing page for the mobile -> web payment handoff.
        source: "/handoff",
        headers: [{ key: "X-Robots-Tag", value: "noindex" }],
      },
    ];
  },
  webpack: (config) => {
    return config;
  },
};

export default nextConfig;
