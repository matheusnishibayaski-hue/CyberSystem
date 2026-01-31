import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { executeSecurityScan, executeZapScan } = require('./scanService');

export async function runSemgrep(target) {
  return executeSecurityScan();
}

export async function runZap(target) {
  return executeZapScan();
}
