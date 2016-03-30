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

  Extract.remoteMethod(
    'neuraltalk2',
    {
      description: 'Run neuraltalk2 for image url',
      accepts: {
        arg: 'args',
        type: 'object',
        description: 'object with property "image_url"',
        required: true,
        http: { source: 'body' }
      },
      returns: {type: 'object', root: true},
      http: {path: '/neuraltalk2', verb: 'post'}
    }
  );

  Extract.neuraltalk2 = function(args, cb) {
    var request = require('request-json-light');
    var client = request.newClient('http://neuraltalk2:5000/');

    var params = {
      url: args.image_url
    };

    client.post('addURL/', params, function(err, res, body) {
      if (err) return cb(err);

      // artificial wait for neuraltalk2 to finish (2-step process).
      // client should make calls until something returned.
      setTimeout(getCaption(body), 10*1000);

      function getCaption(imgObj) {
        return function() {
          client.get('caption/' + imgObj.sha256sum, function(err, res, body) {
            if (err) return cb(err);

            cb(null, body.caption);
          });
        };
      }
    });
  };

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
