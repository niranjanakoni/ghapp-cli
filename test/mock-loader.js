/**
 * Mock loader for ES modules testing
 * This loader helps resolve module imports during testing
 */

import { fileURLToPath } from 'url';
import { dirname, resolve as pathResolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function resolve(specifier, context, nextResolve) {
  // Let Node.js handle the resolution normally
  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  // Let Node.js handle the loading normally
  return nextLoad(url, context);
}
