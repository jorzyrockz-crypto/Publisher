import type { IncomingMessage, ServerResponse } from 'node:http';

/** Type shim so `vite.config.ts` can mount the dev server route. */
export default function handler(req: IncomingMessage, res: ServerResponse): Promise<void>;
