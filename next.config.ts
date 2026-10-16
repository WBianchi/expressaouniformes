import type { NextConfig } from 'next';
const nextConfig:NextConfig={
  // Use the in-process compiler API; the local runtime does not relay child CLI stdout.
  experimental:{useTypeScriptCli:false},
  async redirects() {
    // "sob medida" virou "Monte seu pedido" (orçamento para empresas)
    return [{ source: "/sob-medida", destination: "/orcamento", permanent: true }];
  },
};
export default nextConfig;
