// def: find stored feed data and send to ner
'use strict';

const request = require('request');
const extractorUrl = 'http://localhost:3001/api/extract/process';
const app = require('../../server/server');
const Extract = app.models.Extract;
const FeedObject = app.models.FeedObject;
const WAIT = 10; //seconds

// recursively run, with a wait period
(function run() {
  FeedObject.findOne({where: {processed: false}})
  .then(extract)
  .then(markAsProcessed)
  .then(feedObject => {
    if (!feedObject) {
      // if no more items, lets take a break
      return new Promise((resolve, _) => {
        setTimeout(resolve, WAIT * 1000);
      });
    }
    run();
  })
  .catch(console.error);
})();

function extract(feedObject) {
  if (!feedObject) return;
  console.log('ETL for', feedObject.guid);
  return ner(feedObject).then(() => feedObject);
}

function ner(feedObject) {
  switch(feedObject.extractType.toLowerCase()) {
    case 'stanford':
      return Extract.sendToStanNer(feedObject.description);
    case 'mitie':
      return Extract.sendToMitie(feedObject.description);
    default:
      throw new Error('unknown extract type');
  }
}

function markAsProcessed(feedObject) {
  if (!feedObject) {
    return;
  } else {
    console.log('Processing:', feedObject);
    return feedObject.updateAttributes({processed: true});
  }
}
