// Print the *shape* of a large JSON file — keys, types, array sizes, a couple of
// sample values per node — instead of its contents, so a multi-MB response can
// be understood without opening it.
import { readFileSync } from 'node:fs';

const file = process.argv[2];
const maxDepth = Number(process.argv[3] ?? 6);
if (!file) { console.error('usage: node scripts/inspect-json.mjs <file.json> [maxDepth]'); process.exit(1); }

const raw = readFileSync(file, 'utf8');
const data = JSON.parse(raw);

const kind = v => Array.isArray(v) ? 'array' : v === null ? 'null' : typeof v;
const sample = v => {
  const s = typeof v === 'string' ? JSON.stringify(v.length > 48 ? v.slice(0, 45) + '…' : v) : String(v);
  return s;
};

function walk(node, path, depth) {
  const t = kind(node);
  if (t === 'array') {
    console.log(`${'  '.repeat(depth)}${path} : array(${node.length})`);
    if (node.length && depth < maxDepth) walk(node[0], '[0]', depth + 1);
  } else if (t === 'object') {
    const keys = Object.keys(node);
    console.log(`${'  '.repeat(depth)}${path} : object {${keys.length} keys}`);
    if (depth >= maxDepth) return;
    for (const k of keys) {
      const v = node[k];
      const vt = kind(v);
      if (vt === 'object' || vt === 'array') walk(v, k, depth + 1);
      else console.log(`${'  '.repeat(depth + 1)}${k} : ${vt} = ${sample(v)}`);
    }
  } else {
    console.log(`${'  '.repeat(depth)}${path} : ${t} = ${sample(node)}`);
  }
}
walk(data, file.split('/').pop(), 0);
