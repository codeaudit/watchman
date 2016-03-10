'use strict';

const request = require('request');
const extractorUrl = 'http://localhost:3001/api/extract/process';
const app = require('../../server/server');
const Extract = app.models.Extract;
const FeedObject = app.models.FeedObject;
const WAIT_SECS = 10;

(function recurse() {
  return FeedObject.findOne({where: {processed: false}})
  .then(extract)
  .then(markAsProcessed)
  .then(recurse)
  .catch(console.error);
})();

function extract(feedObject) {
  if (!feedObject) return;
  console.log('ETL for', feedObject.guid);
  return Extract.sendToNer(feedObject.description)
  .then(() => feedObject);
}

function markAsProcessed(feedObject) {
  if (!feedObject) {
    // if no more items, lets take a short break
    return new Promise((resolve, _) => {
      setInterval(resolve, WAIT_SECS * 1000);
    });
  } else {
    console.log('Processing:', feedObject);
    return feedObject.updateAttributes({processed: true});
  }
}
