'use strict';

var _ = require('lodash'),
  entityExtractor = require('../../lib/entity-extractor');

module.exports = function(Extract) {

  Extract.remoteMethod(
    'run',
    {
      description: 'Run entity extraction for given text',
      accepts: {
        arg: 'args',
        type: 'object',
        description: 'object with properties "text" and "extract_type"',
        required: true,
        http: { source: 'body' }
      },
      returns: {type: 'object', root: true},
      http: {path: '/run', verb: 'post'}
    }
  );

  Extract.run = function(args, cb) {
    var extractType = _.capitalize(args.extract_type || 'mitie');
    var method = 'extractWith' + extractType;
    var extract = entityExtractor[method](args.text);

    extract
    .then(entities => cb(null, entities))
    .catch(err => cb(err));
  };

};
