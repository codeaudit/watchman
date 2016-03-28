// def: wrapper for entity extractors
'use strict';

var app = require('../server/server'),
  fs = require('fs'),
  path = require('path'),
  tmpPath = '../temp/',
  mkdirp = require('mkdirp'),
  StanNer = require('node-ner'),
  request = require('request-json-light'),
  textract = require('textract'),
  syncPromises = require('../server/util/generator-promises'),
  _ = require('lodash'),
  stanNer = new StanNer({
    install_path: path.join(__dirname, '../stanford-ner-2014-10-26')
  }),
  mitieUrl = 'http://mitie:8888/'; // dev tip: add mitie to /etc/hosts

mkdirp(path.join(__dirname, tmpPath), function(err) {
  if (err) {
    console.error(err);
  }
});

module.exports = {

  extractWithMitie(text, mimeType) {
    mimeType = mimeType || 'text/html';
    var context = this;
    return syncPromises(function* () {
      text = yield context.extractText(text, mimeType);
      return context.requestMitie(text);
    })();
  },

  requestMitie(text) {
    var client = request.newClient(mitieUrl);
    text = text.replace(/[^\x00-\x7F]/g, ''); // rm non-ascii for mitie
    return new Promise((res, rej) => {
      client.post('ner', { text: text }, (err, _, body) => {
        if (err) {
          console.error(err);
          return rej(err);
        }
        console.log(body);
        res(body.entities);
      });
    });
  },

  extractText(dirtyText, mimeType) {
    return new Promise((res, rej) => {
      var buf = new Buffer(dirtyText, 'utf-8'); // assume utf8
      textract.fromBufferWithMime(mimeType, buf, (err, text) => {
        if (err) {
          console.error('textract err:', err);
          return rej(err);
        }
        res(text);
      });
    });
  },

  extractWithStanford(text, mimeType) {
    mimeType = mimeType || 'text/html';
    var filePath = path.join(__dirname, tmpPath + '/data' + Date.now() + '.txt');
    return new Promise(function(resolve,reject){
      textract.fromBufferWithMime(mimeType, new Buffer(text), function(err, data) {
        if (err) {
          console.error(err);
          return reject(err);
        }
        fs.writeFile(filePath, data, err => {
          if (err) {
            console.error(err);
            return reject(err);
          }
          console.log("file saved");

          stanNer.fromFile(filePath, entities => {
            fs.unlink(filePath, err => {
              if (err) {
                console.error(err);
                return reject(err);
              }
              console.log("File deleted successfully!");
            });
            resolve(entities);
          });
        });
      });
    });
  },

  // args:
  // defaults:
    // date: default date if not extracted
    // mimeType: for textract
  //TODO: combine with mitie eventize
  eventizeWithStanford(text, defaults) {
    defaults = defaults || {};
    var models = app.models;
    var ParsedEvent = models.ParsedEvent;
    var Geocoder = models.Geocoder;

    return this.extractWithStanford(text, defaults.mimeType)
    .then(entities => {
      var newEvent = {
        people: entities.PERSON,
        organizations: entities.ORGANIZATION,
        dates: entities.DATE,
        locations: entities.LOCATION,
        sourceText: text
      };
      // newEvent.message = JSON.stringify(entities);
      newEvent.message = text;
      if (!(newEvent.dates && newEvent.dates.length)) {
        newEvent.dates = [defaults.date];
      }

      return ParsedEvent.create(newEvent);
    })
    .then(parsedEvent => {
      return Geocoder.geocodeEvent(parsedEvent.id);
    });
  },

  // args:
  // defaults:
    // date: default date if not extracted
    // mimeType: for textract
  eventizeWithMitie(text, defaults) {
    defaults = defaults || {};
    var models = app.models;
    var ParsedEvent = models.ParsedEvent;
    var Geocoder = models.Geocoder;

    function extract(entities, tag) {
      return _(entities)
      .filter(item => item.tag === tag)
      .map('label').uniq().value();
    }

    return this.extractWithMitie(text, defaults.mimeType)
    .then(entities => {
      var newEvent = {
        people: extract(entities, 'PERSON'),
        organizations: extract(entities, 'ORGANIZATION'),
        dates: extract(entities, 'DATE'),
        locations: extract(entities, 'LOCATION'),
        sourceText: text
      };
      newEvent.message = text;
      if (!(newEvent.dates && newEvent.dates.length)) {
        newEvent.dates = [defaults.date];
      }

      return ParsedEvent.create(newEvent);
    })
    .then(parsedEvent => {
      return Geocoder.geocodeEvent(parsedEvent.id);
    });
  }

};
