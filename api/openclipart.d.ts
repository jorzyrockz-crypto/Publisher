import type { IncomingMessage, ServerResponse } from 'node:http';

/** Type shim so `vite.config.ts` can mount the dev server route. */
export default function handler(req: IncomingMessage, res: ServerResponse): Promise<void>;
export function parseSearchPage(
  html: string,
  page: number,
  perPage: number
): { items: Array<Record<string, unknown>>; total: number; hasMore: boolean; pageCount: number };
