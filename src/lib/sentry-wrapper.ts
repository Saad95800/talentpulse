import * as SentryModule from '@sentry/nextjs';

/**
 * Sentry Wrapper for robust interop between Next.js (Browser/Edge) and Standalone Node (Worker).
 * In some ESM environments, named exports from '@sentry/nextjs' might be missing on the root object,
 * but present on the .default export.
 */
const Sentry = (SentryModule as any).default || SentryModule;

// Safely extract functions with fallbacks to avoid crashes
export const init = Sentry.init || (() => console.warn("[Sentry] init non disponible"));
export const captureException = Sentry.captureException || ((err: any) => console.error("[Sentry:Fallback] Exception:", err));
export const captureMessage = Sentry.captureMessage || ((msg: string) => console.log("[Sentry:Fallback] Message:", msg));

// Re-export the main object for those who prefer Sentry.xxx pattern
export default Sentry;
