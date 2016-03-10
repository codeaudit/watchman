'use strict';

module.exports = function(ParsedEvent) {

  ParsedEvent.destroyData = function(cb) {

    ParsedEvent.destroyAll();

    cb(null,'All data destroyed.');
  };

  ParsedEvent.remoteMethod(
    'destroyData',
    {
      accepts: [
      ],
      returns: {arg: 'data', root:true},
      http: {path: '/destroy',verb: 'get'}
    }
  );

};
