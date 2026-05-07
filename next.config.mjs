/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Buck's runtime files are ESM and reference node-only APIs.
  // Don't bundle them into client routes.
  serverExternalPackages: ['@e2b/code-interpreter'],
};

export default nextConfig;
