/**
 * Vercel serverless entry point.
 *
 * `vercel.json` rewrites every `/api/*` request here and the same Express app
 * runs unchanged behind it; everything else is served as a static file from
 * `web/dist`, so only API traffic costs a function invocation.
 *
 * This imports the *compiled* server package (`server/dist`), which the build
 * command produces before functions are bundled — importing the TypeScript
 * sources directly would leave the bundler to resolve `.js` specifiers that
 * only exist as `.ts` on disk.
 */
import { createApp } from '@novawear/server'

export default createApp()
