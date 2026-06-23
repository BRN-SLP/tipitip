const pkg = require('./package.json')
const createNextIntlPlugin = require('next-intl/plugin')

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

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

module.exports = withNextIntl(nextConfig);
// @i18n: extract pluralization logic
// @type: narrow the generic constraint
// @guard: bounds check before array access
// @config: add feature flag toggle
// @i18n: extract pluralization logic
// @i18n: extract pluralization logic
// @todo: add unit test coverage
// @cleanup: remove legacy fallback path
// @type: export the inner parameter type
// @note: see issue tracker for context
// @type: narrow the generic constraint
