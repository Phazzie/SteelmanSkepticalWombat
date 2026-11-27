// Seam-v2 freeze by hand: fingerprints the plan, contracts and tests.
// `npm run freeze` records them; `npm run freeze:check` fails if any changed since.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const roots = ['plan/PLAN.md', 'contracts', 'tests'];
const files = [];
const walk = (p) => {
    if (p.endsWith('.ts') || p.endsWith('.md')) return files.push(p);
    if (!p.includes('.')) for (const f of readdirSync(p)) walk(join(p, f));
};
roots.forEach(walk);
const prints = Object.fromEntries(
    files.sort().map((f) => [f, createHash('sha256').update(readFileSync(f)).digest('hex').slice(0, 16)])
);
const out = '.seam/freeze.json';
if (process.argv.includes('--check')) {
    if (!existsSync(out)) throw new Error('No freeze recorded.');
    const frozen = JSON.parse(readFileSync(out, 'utf8')).files;
    const changed = Object.keys({ ...frozen, ...prints }).filter((f) => frozen[f] !== prints[f]);
    if (changed.length) {
        console.error('Frozen files changed without a DRIFT-LOG entry:\n' + changed.join('\n'));
        process.exit(1);
    }
    console.log(`Freeze intact: ${files.length} files.`);
} else {
    mkdirSync('.seam', { recursive: true });
    writeFileSync(out, JSON.stringify({ frozenAt: new Date().toISOString(), files: prints }, null, 2) + '\n');
    console.log(`Froze ${files.length} files.`);
}
