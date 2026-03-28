/**
 * esbuild config for the ALIVE Studio browser bundle.
 *
 * This bundles ALL TypeScript source (client app + plugins + packages)
 * into a single public/bundle.js file served by the Express server.
 *
 * @alive-studio/* aliases are resolved to local source trees so no
 * npm workspaces or published packages are needed.
 *
 * To add --watch mode: node esbuild.config.mjs --watch
 */

import * as esbuild from 'esbuild';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const watch     = process.argv.includes('--watch');

const ctx = await esbuild.context({
  entryPoints: [resolve(__dirname, 'src/client/app.ts')],
  bundle:      true,
  outfile:     resolve(__dirname, 'public/bundle.js'),
  platform:    'browser',
  format:      'iife',
  target:      ['chrome100', 'firefox100', 'safari15'],
  sourcemap:   true,

  // Anchor tsconfig lookup here so esbuild never walks up past this directory
  // and finds empty/stray tsconfig.json files in parent folders.
  tsconfig: resolve(__dirname, 'tsconfig.client.json'),

  // Resolve @alive-studio/* package names to local source files.
  // No npm install needed for these — esbuild reads TypeScript directly.
  alias: {
    '@alive-studio/shared-types':   resolve(__dirname, '../packages/shared-types/src/index.ts'),
    '@alive-studio/runtime-client': resolve(__dirname, '../packages/runtime-client/src/index.ts'),
    '@alive-studio/launcher':       resolve(__dirname, '../plugins/alive-launcher/src/index.ts'),
    '@alive-studio/trace':          resolve(__dirname, '../plugins/alive-trace/src/index.ts'),
    '@alive-studio/signals':        resolve(__dirname, '../plugins/alive-signals/src/index.ts'),
    '@alive-studio/state':          resolve(__dirname, '../plugins/alive-state/src/index.ts'),
    '@alive-studio/logs':           resolve(__dirname, '../plugins/alive-logs/src/index.ts'),
  },

  logLevel: 'info',
});

if (watch) {
  await ctx.watch();
  console.log('[esbuild] Watching for changes…');
} else {
  await ctx.rebuild();
  await ctx.dispose();
  console.log('[esbuild] Bundle written → public/bundle.js');
}
