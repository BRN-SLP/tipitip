const pkg = require('./package.json')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Build identity for the footer, so the version never goes stale: the
  // package version is the single source to bump per release, and the short
  // commit SHA (injected by Vercel) changes on every deploy. Inlined at build.
  env: {
    NEXT_PUBLIC_APP_VERSION: pkg.version,
    NEXT_PUBLIC_COMMIT_SHA: (process.env.VERCEL_GIT_COMMIT_SHA || '').slice(0, 7),
  },
  webpack: (config) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding')
    return config
  },
};

module.exports = nextConfig;
