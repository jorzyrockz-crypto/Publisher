import type { IncomingMessage, ServerResponse } from 'node:http';

/**
 * Type shim for the plain-JS Vercel function, so `vite.config.ts` can mount the
 * same handler on the dev server (one implementation, dev and production agree).
 */
export default function handler(req: IncomingMessage, res: ServerResponse): Promise<void>;
