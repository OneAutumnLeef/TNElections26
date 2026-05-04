import type { NextConfig } from "next";

// In production we mount the app at /tnelections26 (under derajyojith.dev).
// In dev we serve from / so localhost:3000 keeps working.
// To override locally: BASE_PATH=/tnelections26 npm run dev
const basePath = process.env.BASE_PATH ?? "";

const nextConfig: NextConfig = {
  basePath,
  // Make the basePath visible to client code (SWR keys, fetch URLs).
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
