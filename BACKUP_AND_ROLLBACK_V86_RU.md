import fs from 'node:fs';

const html = fs.readFileSync('index.html', 'utf8');
const required = [
  'second-brain-space-v86-autopilot-20260721-r1',
  "const LABEL = 'V86 · AUTOPILOT'",
  'v86-capture-fab',
  'autoDailySnapshot',
  'activateScheduledHabitIfDue',
  'restoreSnapshot'
];

for (const token of required) {
  if (!html.includes(token)) throw new Error(`Missing required token: ${token}`);
}

const match = html.match(/<script>'use strict';\n([\s\S]*?)<\/script>/);
if (!match) throw new Error('Main inline JavaScript was not found');
new Function(`'use strict';\n${match[1]}`);

for (const file of ['force-update.html', 'manifest.webmanifest', 'offline.html']) {
  if (!fs.existsSync(file)) throw new Error(`Missing file: ${file}`);
}

console.log('Second Brain OS V86 QA passed');
