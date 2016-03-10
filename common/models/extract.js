'use strict';

var app = require('../../server/server'),
  fs = require('fs'),
  path = require('path'),
  tmpPath = '../../temp/',
  mkdirp = require('mkdirp'),
  Ner = require('node-ner'),
  request = require('request'),
  textract = require('textract'),
  ner = new Ner({
    install_path: path.join(__dirname, '../../stanford-ner-2014-10-26')
  });

mkdirp(path.join(__dirname, tmpPath), function(err) {
  if (err) {
    console.error(err);
  }
});

module.exports = function(Extract) {

  // var extractorName = "stanford-ner";

  // Extract.extractionMap = {};

  // Extract.createOrUpdateExtraction = function(name,value,dwTrailUrlId,requester){
  //   if(Extract.extractionMap[value]){
  //     Extract.extractionMap[value].occurrences++;
  //   return;
  //   }
  //   Extract.extractionMap[value] = {
  //     "value": value,
  //     "occurrences":1,
  //     "dwTrailUrlId": dwTrailUrlId,
  //     "extractorTypes":[name],
  //     "extractor": extractorName,
  //     "requester": requester
  //   };
  // };

  Extract.sendToNer = function(data){
    var models = Extract.app.models;
    var ParsedEvent = models.ParsedEvent;
    var Geocoder = models.Geocoder;

    return new Promise(function(resolve,reject){
      textract.fromBufferWithMime('text/html', new Buffer(data), function(err, data) {
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

          ner.fromFile(filePath, function(entities) {
            console.log(entities);

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

            message += 'SOURCE:' + data;

            var newEvent = {
              people: entities.PERSON,
              organizations: entities.ORGANIZATION,
              dates: entities.DATE,
              locations: entities.LOCATION,
              message: message,
              sourceText: data,
              lat: null,
              lng: null
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
