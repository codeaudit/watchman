'use strict';

const _debug = require('debug'),
  path = require('path');

// def: miscellaneous debug & logging shortcuts
module.exports = {
  // wrap debug module with calling module's filename
  debug() {
    let logId = path.basename(module.parent.filename, '.js');
    // _debug(path.basename(module.filename, '.js'))(logId);
    return _debug(logId);
  }
};
