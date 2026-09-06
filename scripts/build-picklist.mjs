// Turns a Crashzone /api/pick-list response (raw JSON, or the HAR it came in)
// into lib/picklist.js — a compact module the quote builder can search.
//
//   node scripts/build-picklist.mjs data/crashzone/picklist.har
//
// Rows are stored as tuples to keep the client bundle small:
//   [code, description, areaId, hours]   hours = 0 when the list carries no
//                                        standard time for that item.
import { readFileSync, writeFileSync } from 'node:fs';

const src = process.argv[2] ?? 'data/crashzone/picklist.har';
const raw = JSON.parse(readFileSync(src, 'utf8'));

// Accept either the API response itself or a HAR wrapping it.
const payload = raw.log
  ? JSON.parse(raw.log.entries.find(e => e.request.url.includes('pick-list')).response.content.text)
  : raw;
const { ItemDescriptionList: items, VehicleAreaList: areas } = payload.data;

// QuickFillType groups the same catalogue several times, once per quote column.
// 30 and 32 are the two that carry standard times.
const TYPES = { 30: 'rr', 31: 'repair', 32: 'paint', 33: 'part', 34: 'sublet', 35: 'misc' };

const byType = {};
for (const [code, name] of Object.entries(TYPES)) {
  const seen = new Set();
  byType[name] = items
    .filter(i => i.QuickFillType === Number(code))
    .filter(i => { const k = i.Field1 + '|' + i.Field5; if (seen.has(k)) return false; seen.add(k); return true; })
    .map(i => [i.Field1, i.Field2, Number(i.Field5) || 0, i.Field3 === '' ? 0 : Number(i.Field3) || 0]);
}

const areaList = areas
  .filter(a => a.GroupID)
  .map(a => [Number(a.GroupID), a.GroupText]);

const out = `// GENERATED — do not edit by hand.
// Built from a Crashzone pick-list response by scripts/build-picklist.mjs.
// Rows are [code, description, areaId, hours]; hours is 0 where the list
// carries no standard time.

export const PICK_AREAS = new Map(${JSON.stringify(areaList)});

export const PICK_LIST = ${JSON.stringify(byType)};

// Quote line types map onto the pick-list groups that make sense for them.
export const PICK_FOR_LINE = {
  labour: 'rr',
  paint: 'paint',
  part: 'part',
  sublet: 'sublet',
  misc: 'misc',
};

// Search one group. Prefix matches on the code or the description rank above
// substring hits, which is what makes two-letter typing ("fb", "lfd") useful.
export function searchPickList(group, query, limit = 40) {
  const rows = PICK_LIST[group] || [];
  const q = String(query || '').trim().toLowerCase();
  const hit = (r) => {
    const code = r[0].toLowerCase(), desc = r[1].toLowerCase();
    if (!q) return 3;
    if (code === q) return 0;
    if (code.startsWith(q)) return 1;
    if (desc.startsWith(q)) return 2;
    if (desc.includes(q) || code.includes(q)) return 3;
    return -1;
  };
  return rows
    .map(r => [hit(r), r])
    .filter(([s]) => s >= 0)
    .sort((a, b) => a[0] - b[0] || a[1][1].localeCompare(b[1][1]))
    .slice(0, limit)
    .map(([, r]) => ({ code: r[0], description: r[1], area: PICK_AREAS.get(r[2]) || '', hours: r[3] }));
}
`;
writeFileSync('lib/picklist.js', out);

const counts = Object.entries(byType).map(([k, v]) => `${k}:${v.length}`).join(' ');
console.error(`wrote lib/picklist.js — areas:${areaList.length} ${counts} (${(out.length / 1024).toFixed(0)} KB)`);
