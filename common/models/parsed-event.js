'use strict';

module.exports = function(ParsedEvent) {

  ParsedEvent.destroyData = function(cb) {
    ParsedEvent.destroyAll()
    .then(() => cb(null, {data: 'All data destroyed'}))
    .catch(cb);
  };

  ParsedEvent.remoteMethod(
    'destroyData',
    {
      accepts: [
      ],
      returns: {arg: 'data', root: true},
      http: {path: '/destroy',verb: 'get'}
    }
  );

};
