#!/usr/bin/env node
const fs = require('fs');
const status = JSON.parse(fs.readFileSync('repo_status.json', 'utf8'));
console.log(JSON.stringify(status, null, 2));
