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
  _ = require('lodash'),
  stanNer = new StanNer({
    install_path: path.join(__dirname, '../stanford-ner-2014-10-26')
  }),
  mitieUrl = 'http://mitie:8888/';

mkdirp(path.join(__dirname, tmpPath), function(err) {
  if (err) {
    console.error(err);
  }
});

module.exports = {

  extractWithMitie(text) {
    var client = request.newClient(mitieUrl);
    text = text.replace(/[^\x00-\x7F]/g, ""); // rm non-ascii for mitie
    return new Promise(function(resolve, reject) {
      client.post('ner', {text: text}, function(err, _, body) {
        if (err) {
          console.error(err);
          return reject(err);
        }
        console.log(body);
        resolve(body.entities);
      });
    });
  },

  extractWithStanford(text) {
    var filePath = path.join(__dirname, tmpPath + '/data' + Date.now() + '.txt');
    return new Promise(function(resolve,reject){
      textract.fromBufferWithMime('text/html', new Buffer(text), function(err, data) {
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

  //TODO: combine with mitie eventize
  eventizeWithStanford(text) {
    var models = app.models;
    var ParsedEvent = models.ParsedEvent;
    var Geocoder = models.Geocoder;

    return this.extractWithStanford(text)
    .then(entities => {
      var newEvent = {
        people: entities.PERSON,
        organizations: entities.ORGANIZATION,
        dates: entities.DATE,
        locations: entities.LOCATION,
        sourceText: text
      };
      newEvent.message = JSON.stringify(entities);

      return ParsedEvent.create(newEvent);
    })
    .then(parsedEvent => {
      return Geocoder.geocodeEvent(parsedEvent.id);
    });
  },

  eventizeWithMitie(text) {
    var models = app.models;
    var ParsedEvent = models.ParsedEvent;
    var Geocoder = models.Geocoder;

    function extract(entities, tag) {
      return _(entities).filter(item => item.tag == tag).map('label').value();
    }

    return this.extractWithMitie(text)
    .then(entities => {
      var newEvent = {
        people: extract(entities, 'PERSON'),
        organizations: extract(entities, 'ORGANIZATION'),
        dates: extract(entities, 'DATE'),
        locations: extract(entities, 'LOCATION'),
        sourceText: text
      };
      newEvent.message = JSON.stringify(entities);

      return ParsedEvent.create(newEvent);
    })
    .then(parsedEvent => {
      return Geocoder.geocodeEvent(parsedEvent.id);
    });
  }

};
