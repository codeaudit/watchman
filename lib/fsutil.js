'use strict';

// def: file, dir helpers

const unzip = require('unzip'),
  fs = require('fs');

module.exports = {
  decompress(filePath) {
    const downloadPath = filePath.replace(/\.(zip$|(tar.){,1}gz$)/i, '');

    fs.createReadStream(filePath)
    .pipe(unzip.Extract({ path: downloadPath }));
  }
};
