/**
 * Lets the node-based checks import the app's TypeScript the way the bundler does.
 *
 * The source imports without extensions (`./textLayout`), which Vite and tsc resolve happily and
 * plain node does not. Rather than scatter `.ts` across `src/` to satisfy a script, the scripts
 * that need it register this hook:
 *
 *   node --experimental-strip-types --import ./scripts/ts-resolve.mjs scripts/check-*.mjs
 */
import { register } from 'node:module';

register(
  `data:text/javascript,${encodeURIComponent(`
export async function resolve(specifier, context, next) {
  try {
    return await next(specifier, context);
  } catch (error) {
    if (specifier.startsWith('.') && !/\\.[cm]?[jt]s$/.test(specifier)) {
      return next(specifier + '.ts', context);
    }
    throw error;
  }
}
`)}`
);
