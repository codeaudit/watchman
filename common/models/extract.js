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
        description: 'object with properties "text", "extract_type", "mime_type"',
        required: true,
        http: { source: 'body' }
      },
      returns: {type: 'object', root: true},
      http: {path: '/run', verb: 'post'}
    }
  );

  Extract.run = function(args, cb) {
    var mimeType = args.mime_type || 'text/html';
    var extractType = _.capitalize(args.extract_type || 'mitie');
    var method = 'extractWith' + extractType;
    var extract = entityExtractor[method](args.text, mimeType);

    extract
    .then(entities => cb(null, entities))
    .catch(err => cb(err));
  };

  Extract.remoteMethod(
    'textract',
    {
      description: 'Run textract for given text, mime_type',
      accepts: {
        arg: 'args',
        type: 'object',
        description: 'object with properties "text", "mime_type"',
        required: true,
        http: { source: 'body' }
      },
      returns: {type: 'object', root: true},
      http: {path: '/textract', verb: 'post'}
    }
  );

  Extract.textract = function(args, cb) {
    var mimeType = args.mime_type || 'text/html';

    entityExtractor.extractText(args.text, mimeType)
    .then(text => cb(null, text))
    .catch(err => cb(err));
  };
};
