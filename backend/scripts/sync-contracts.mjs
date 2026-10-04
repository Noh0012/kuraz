// Copies the API response types to the mobile app so both sides share one definition.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const source = new URL('../src/contracts.ts', import.meta.url);
const targetDir = new URL('../../mobile/src/types/', import.meta.url);
mkdirSync(targetDir, { recursive: true });
const banner = '// AUTO-GENERATED from backend/src/contracts.ts by `npm run contracts:sync` (in backend/). Do not edit.\n';
writeFileSync(new URL('contracts.ts', targetDir), banner + readFileSync(source, 'utf8'));
console.log('mobile/src/types/contracts.ts updated');
