'use strict';

var app = require('../../server/server'),
  fs = require('fs'),
  path = require('path'),
  tmpPath = '../../temp/',
  mkdirp = require('mkdirp'),
  StanNer = require('node-ner'),
  request = require('request-json-light'),
  textract = require('textract'),
  _ = require('lodash'),
  stanNer = new StanNer({
    install_path: path.join(__dirname, '../../stanford-ner-2014-10-26')
  }),
  mitieUrl = 'http://localhost:8888/';

mkdirp(path.join(__dirname, tmpPath), function(err) {
  if (err) {
    console.error(err);
  }
});

module.exports = function(Extract) {

  Extract.sendToMitie = function(text){
    var models = Extract.app.models;
    var ParsedEvent = models.ParsedEvent;
    var Geocoder = models.Geocoder;
    var client = request.newClient(mitieUrl);
    text = text.replace(/[^\x00-\x7F]/g, ""); // rm non-ascii for mitie

    function extract(entities, tag) {
      return _(entities).filter(item => item.tag == tag).map('label').value();
    }

    return new Promise(function(resolve,reject){
      client.post('ner', {text: text}, function(err, res, body) {
        if(err) {
          reject(err);
          return console.error(err);
        }
        console.log(body);
        var entities = body.entities;

        var newEvent = {
          people: extract(entities, 'PERSON'),
          organizations: extract(entities, 'ORGANIZATION'),
          dates: extract(entities, 'DATE'),
          locations: extract(entities, 'LOCATION'),
          sourceText: text
        };
        newEvent.message = JSON.stringify(entities);

        ParsedEvent.create(newEvent)
        .then(function(parsedEvent) {
          return Geocoder.geocode(parsedEvent.id);
        })
        .then(function(parsedEvent) {
          resolve(parsedEvent);
        })
        .catch(function(err){
          reject(err);
          return console.error(err);
        });
      });

    });
  };

  Extract.sendToStanNer = function(text){
    var models = Extract.app.models;
    var ParsedEvent = models.ParsedEvent;
    var Geocoder = models.Geocoder;

    return new Promise(function(resolve,reject){
      textract.fromBufferWithMime('text/html', new Buffer(text), function(err, data) {
        if(err) {
          reject(err);
          return console.error(err);
        }
        var filePath = path.join(__dirname, tmpPath + "/data" + Date.now() + ".txt");
        console.log("Entering DW StanNER Extractor");

        fs.writeFile(filePath, data, function(err) {
          if(err) {
            reject(err);
            return console.error(err);
          }
          console.log("file saved");

          stanNer.fromFile(filePath, function(entities) {
            var message = '';

            if(entities.PERSON){
              message += 'PERSON:' +entities.PERSON[0] + "</br>";
            }
            if(entities.LOCATION){
              message += 'LOCATION:' +entities.LOCATION[0] + "</br>";
            }
            if(entities.ORGANIZATION){
              message += 'ORG:' +entities.ORGANIZATION[0] + "</br>";
            }

            // message += 'SOURCE:' + data;

            var newEvent = {
              people: entities.PERSON,
              organizations: entities.ORGANIZATION,
              dates: entities.DATE,
              locations: entities.LOCATION,
              message: message,
              sourceText: data
            };

            ParsedEvent.create(newEvent)
            .then(function(parsedEvent) {
              return Geocoder.geocode(parsedEvent.id);
            })
            .then(function(parsedEvent) {
              fs.unlink(filePath, function(err) {
                if (err) {
                  reject(err);
                  return console.error(err);
                }
                console.log("File deleted successfully!");
                resolve(parsedEvent);
              });
            })
            .catch(function(err){
              reject(err);
              return console.error(err);
            });
          });
        });
      });
    });
  };
};
