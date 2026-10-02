/** @type {import('next').NextConfig} */
const nextConfig = {
  // Always .next, because that is where every host expects to find the build.
  //
  // This used to switch to .next-build whenever NODE_ENV was production, to stop
  // a local `next build` overwriting the artifacts of a running `next dev`. On
  // Vercel NODE_ENV is production too, so the build wrote to .next-build and the
  // deployment failed looking for .next — a local convenience that broke the
  // only build that actually ships.
  //
  // The escape hatch is explicit now: NEXT_DIST_DIR=.next-build npm run build
  // when a dev server is up, and nothing special anywhere else.
  distDir: process.env.NEXT_DIST_DIR || '.next',
}

module.exports = nextConfig
