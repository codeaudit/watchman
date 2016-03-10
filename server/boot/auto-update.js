// update db schema from model defs
'use strict';
module.exports = function(app) {
  app.dataSources.db.autoupdate(function(err, result) {});
};
