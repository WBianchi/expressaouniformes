import type { NextConfig } from 'next';
const nextConfig:NextConfig={
  // Use the in-process compiler API; the local runtime does not relay child CLI stdout.
  experimental:{useTypeScriptCli:false},
};
export default nextConfig;
