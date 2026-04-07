import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    // Point root to this site directory to avoid Cyrillic path issues
    root: path.resolve(__dirname),
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn4.telesco.pe' },
      { protocol: 'https', hostname: 'cdn1.telesco.pe' },
      { protocol: 'https', hostname: 'cdn2.telesco.pe' },
      { protocol: 'https', hostname: 'cdn3.telesco.pe' },
    ],
  },
};

export default nextConfig;
