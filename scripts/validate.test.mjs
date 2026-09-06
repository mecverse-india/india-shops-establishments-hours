/**
 * The dataset's credibility rests on one rule: no value without a source.
 * These checks fail the build if that rule, or the shape a consumer relies on,
 * is broken by a contribution.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const { stateHours, stateHoursFieldLabels, stateHoursFieldOrder } = await import(
  join(root, 'state-hours.ts')
);

test('every populated value carries a resolvable source URL', () => {
  for (const state of stateHours) {
    for (const field of stateHoursFieldOrder) {
      const cell = state[field];
      if (cell === null || cell === undefined) continue;
      assert.ok(cell.value?.trim(), `${state.slug}.${field} has an empty value`);
      assert.match(
        cell.source ?? '',
        /^https?:\/\/\S+$/,
        `${state.slug}.${field} has no usable source URL`
      );
    }
  }
});

test('an unverified field is null, never an empty string or a guess', () => {
  for (const state of stateHours) {
    for (const field of stateHoursFieldOrder) {
      const cell = state[field];
      if (cell === null) continue;
      assert.notEqual(cell, undefined, `${state.slug}.${field} is undefined; use null to mean "not verified"`);
    }
  }
});

test('slugs are unique and URL-safe', () => {
  const seen = new Set();
  for (const state of stateHours) {
    assert.match(state.slug, /^[a-z0-9-]+$/, `${state.slug} is not URL-safe`);
    assert.ok(!seen.has(state.slug), `duplicate slug ${state.slug}`);
    seen.add(state.slug);
  }
});

test('every jurisdiction declares name, kind and region', () => {
  for (const state of stateHours) {
    assert.ok(state.name?.trim(), `${state.slug} has no name`);
    assert.ok(['state', 'ut'].includes(state.kind), `${state.slug} has kind "${state.kind}"`);
    assert.ok(state.region?.trim(), `${state.slug} has no region`);
  }
});

test('field labels cover every field in the published order', () => {
  for (const field of stateHoursFieldOrder) {
    assert.ok(stateHoursFieldLabels[field], `${field} is in the order but has no label`);
  }
  assert.equal(
    stateHoursFieldOrder.length,
    Object.keys(stateHoursFieldLabels).length,
    'field order and field labels have drifted apart'
  );
});

test('a recorded conflict explains itself', () => {
  for (const state of stateHours) {
    for (const field of stateHoursFieldOrder) {
      const cell = state[field];
      if (cell?.conflict === undefined) continue;
      assert.ok(
        cell.conflict.trim().length > 20,
        `${state.slug}.${field} flags a conflict without describing it`
      );
    }
  }
});

test('CSV cells cannot begin a spreadsheet formula', async () => {
  const { readFileSync } = await import('node:fs');
  for (const file of ['state-hours.csv', 'sources.csv']) {
    const text = readFileSync(join(root, 'data', file), 'utf8');
    for (const [i, line] of text.split('\n').entries()) {
      if (!line) continue;
      for (const cell of line.split(',')) {
        const bare = cell.startsWith('"') ? cell.slice(1) : cell;
        assert.ok(
          !/^[=+@]/.test(bare),
          `${file}:${i + 1} has a cell starting with a formula character: ${cell.slice(0, 40)}`
        );
      }
    }
  }
});
