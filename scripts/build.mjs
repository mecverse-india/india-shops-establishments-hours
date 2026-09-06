/**
 * Emits data/*.json and data/*.csv from state-hours.ts.
 *
 * The TypeScript file is the one place a value is edited. Everything under
 * data/ is generated, so a contributor cannot fix a figure in the CSV and have
 * it silently disagree with the JSON.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const { stateHours, stateHoursFieldLabels, stateHoursFieldOrder } = await import(
  join(root, 'state-hours.ts')
);

mkdirSync(join(root, 'data'), { recursive: true });

const FIELDS = stateHoursFieldOrder;

const coverage = () => {
  let filled = 0;
  let total = 0;
  let secondary = 0;
  let conflicts = 0;
  for (const state of stateHours) {
    for (const field of FIELDS) {
      total += 1;
      const cell = state[field];
      if (!cell) continue;
      filled += 1;
      if (cell.secondary) secondary += 1;
      if (cell.conflict) conflicts += 1;
    }
  }
  const sources = new Set();
  for (const state of stateHours) {
    for (const field of FIELDS) {
      if (state[field]) sources.add(state[field].source);
    }
  }
  return { jurisdictions: stateHours.length, filled, total, secondary, conflicts, sources: sources.size };
};

const stats = coverage();

const dataset = {
  $schema: './schema.json',
  name: 'India Shops and Establishments working-hours rules',
  description:
    'Per-jurisdiction working-hours rules under India’s Shops and Establishments Acts. Every value carries the source it was verified against; unverified fields are null rather than guessed.',
  license: 'CC-BY-4.0',
  canonical: 'https://workclave.com/tools/shops-establishments-hours',
  repository: 'https://github.com/mecverse-india/india-shops-establishments-hours',
  generated: new Date().toISOString().slice(0, 10),
  coverage: {
    jurisdictionsPublished: stats.jurisdictions,
    jurisdictionsInIndia: 36,
    fieldsPopulated: stats.filled,
    fieldsPossible: stats.total,
    fieldsFromSecondarySources: stats.secondary,
    recordedConflicts: stats.conflicts,
    uniqueSources: stats.sources,
  },
  fields: FIELDS.map((key) => ({ key, label: stateHoursFieldLabels[key] })),
  jurisdictions: stateHours,
};

writeFileSync(join(root, 'data', 'state-hours.json'), `${JSON.stringify(dataset, null, 2)}\n`);

// Long-form CSV: one row per jurisdiction/field, because the values are
// sentences with their own provenance. A wide sheet would bury the source URL.
const escape = (value) => {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const rows = [
  ['jurisdiction', 'slug', 'kind', 'region', 'field', 'field_label', 'value', 'source', 'source_is_secondary', 'conflict'],
];

for (const state of stateHours) {
  for (const field of FIELDS) {
    const cell = state[field];
    rows.push([
      state.name,
      state.slug,
      state.kind,
      state.region,
      field,
      stateHoursFieldLabels[field],
      cell ? cell.value : '',
      cell ? cell.source : '',
      cell && cell.secondary ? 'true' : 'false',
      cell && cell.conflict ? cell.conflict : '',
    ]);
  }
}

writeFileSync(
  join(root, 'data', 'state-hours.csv'),
  `${rows.map((row) => row.map(escape).join(',')).join('\n')}\n`
);

const sourceRows = [['jurisdiction', 'slug', 'field', 'source', 'is_secondary']];
for (const state of stateHours) {
  for (const field of FIELDS) {
    const cell = state[field];
    if (cell) sourceRows.push([state.name, state.slug, field, cell.source, cell.secondary ? 'true' : 'false']);
  }
}
writeFileSync(
  join(root, 'data', 'sources.csv'),
  `${sourceRows.map((row) => row.map(escape).join(',')).join('\n')}\n`
);

console.log(
  `Wrote ${stats.jurisdictions} jurisdictions, ${stats.filled}/${stats.total} fields, ${stats.sources} sources.`
);
