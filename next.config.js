/** @type {import('next').NextConfig} */
const nextConfig = {
  // A production build and the dev server both default to .next, so running
  // `next build` while `next dev` is up overwrites the dev server's artifacts
  // and it starts returning 500. Builds go somewhere else.
  distDir: process.env.NODE_ENV === 'production' ? '.next-build' : '.next',
}

module.exports = nextConfig
