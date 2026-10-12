import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Os pacotes internos são publicados como código-fonte TypeScript.
  transpilePackages: ["@nosweat/schema", "@nosweat/fixtures", "@nosweat/templates"],
};

export default nextConfig;
