// update db schema from model defs
'use strict';
module.exports = function(app) {
  for (var ds in app.dataSources) {
    app.dataSources[ds].autoupdate(function(err, result) {});
  }
};
