#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const target = process.argv[2] || '.';
const root = path.resolve(process.cwd(), target);
const forbidden = ['patientName', 'mrn', 'ssn', 'socialSecurity', 'dateOfBirth', 'phoneNumber', 'emailAddress', 'streetAddress'];
const allowedExt = new Set(['.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.yaml', '.yml']);
let violations = [];

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (entry === 'node_modules' || entry === '.git' || entry === 'dist' || entry === '.next') continue;
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full);
    else if (allowedExt.has(path.extname(full))) {
      const text = fs.readFileSync(full, 'utf8');
      for (const key of forbidden) {
        if (text.includes(key)) violations.push(`${full}: contains forbidden PHI key string "${key}"`);
      }
    }
  }
}
walk(root);
if (violations.length) {
  console.error(violations.join('\n'));
  process.exit(1);
}
console.log(`PHI lint passed for ${target}`);
