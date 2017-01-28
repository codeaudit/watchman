#!/usr/bin/env node

require('dotenv').config({silent: true});

// create browser global object to store system vars in browser.
// used in npm scripts in package.json

// take all env vars with prefix 'UI_'
let envVars = {};
for(let k in process.env) {
  let match = k.match(/^UI_(.*)/);
  if (match) {
    envVars[match[1]] = process.env[k];
  }
}

// output can be piped to scripts
process.stdout.write(`const WatchmanEnv = ${JSON.stringify(envVars)};`);
