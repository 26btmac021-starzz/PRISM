import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
const source=readFileSync(new URL('../src/demo.ts',import.meta.url),'utf8')
for(const id of ['normal','rainfall','slope','drainage','vibration','disconnected','escalation','workflow'])assert(source.includes(`id:'${id}'`),`Missing demo scenario ${id}`)
for(const p of ['/','/monitor','/risk','/map','/reports','/events','/alerts','/settings'])assert(readFileSync(new URL('../src/main.tsx',import.meta.url),'utf8').includes(`path="${p}"`),`Missing page ${p}`)
console.log('All eight demo scenarios and eight page routes are defined. Runtime interactions require browser testing.')
