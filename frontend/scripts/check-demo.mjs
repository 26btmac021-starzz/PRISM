/** Dependency-light smoke tests for the demo data model (run after npm install). */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createRequire } from 'node:module';
import ts from 'typescript';
const require = createRequire(import.meta.url);
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'prism-demo-'));
for (const relative of ['types/index.ts', 'utils/index.ts', 'services/demo/data.ts']) {
  const input = new URL(`../src/${relative}`, import.meta.url);
  const output = path.join(temp, relative.replace(/\.ts$/, '.cjs'));
  // Compiled files reference extensionless relative paths, so emit .js too.
  const js = output.replace(/\.cjs$/, '.js');
  fs.mkdirSync(path.dirname(js), { recursive: true });
  fs.writeFileSync(js, ts.transpileModule(fs.readFileSync(input, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText);
}
const { makeDemo, scenarios } = require(path.join(temp, 'services/demo/data.js'));
const { hazardKeys, sensorKeys, riskCategory } = require(path.join(temp, 'utils/index.js'));
for (const scenario of scenarios) {
  const state = makeDemo(scenario.id, Date.UTC(2026, 9, 19, 12));
  if (state.sites.length !== 3 || state.sensors.length !== 3 * sensorKeys.length || state.events.length < 60) throw new Error(`Bad snapshot for ${scenario.id}`);
  for (const key of hazardKeys) {
    if (riskCategory(state.hazards[key].score) !== state.hazards[key].category) throw new Error(`Incorrect category: ${scenario.id} / ${key}`);
    if (!state.sites.every(site => site.hazardScores && typeof site.hazardScores[key] === 'number')) throw new Error(`No site risk: ${scenario.id} / ${key}`);
  }
  if (scenario.id === 'stale' && !state.sensors.some(sensor => sensor.value === null)) throw new Error('Stale scenario has no unavailable reading');
  if (scenario.id === 'normal' && state.alerts.length !== 0) throw new Error('Normal scenario should have no triggered alerts');
  console.log(`PASS ${scenario.id.padEnd(12)} ${state.sensors.length} sensors · ${state.alerts.length} alerts`);
}
fs.rmSync(temp, { recursive: true, force: true });
console.log('All PRISM demo scenarios validated.');
