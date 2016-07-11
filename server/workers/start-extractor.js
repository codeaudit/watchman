#!/usr/bin/env node

'use strict';

// for now they run in a single process but should be separated
module.exports = {
  start() {
    require('./collector').start();
    require('./extractor').start();
  }
};
