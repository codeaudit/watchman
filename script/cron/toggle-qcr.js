#!/usr/bin/env node

'use strict';

// def: toggle slc env var to stop processing of qcr posts.
try {
  require('shelljs/global');
} catch(ex) {
  console.log('Cannot find shelljs. npm install it or export NODE_PATH to node_modules.');
  process.exit(1);
}

const cmd = 'slc ctl env-set 1 IGNORE_QCR=',
  ON_MINS = 1;
let cmdOut;

console.log(new Date(), 'on');
cmdOut = exec(cmd + '0', {silent: true});
confirmExec(cmdOut);

// toggle off after some time
setTimeout(() => {
  console.log(new Date(), 'off');
  cmdOut = exec(cmd + '1', {silent: true});
  confirmExec(cmdOut);
}, 1000 * 60 * ON_MINS);

function confirmExec(cmdOut) {
  echo(cmdOut.stdout);
  if (cmdOut.code !== 0) {
    echo('ERR:' + cmdOut.stderr);
    exit(1);
  }
}
