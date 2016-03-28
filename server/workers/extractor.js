// def: find stored feed data and send to ner
'use strict';

const request = require('request'),
  entityExtractor = require('../../lib/entity-extractor'),
  app = require('../../server/server'),
  Extract = app.models.Extract,
  FeedObject = app.models.FeedObject,
  _ = require('lodash'),
  WAIT = 30; //seconds

// recursively run, with a wait period
(function run() {
  FeedObject.findOne({ where: { processed: false } })
  .then(extract)
  .then(markAsProcessed)
  .then(feedObject => {
    if (!feedObject) {
      // if no more items, lets take a break
      console.log('waiting for new feed data...');
      setTimeout(run, WAIT * 1000);
    } else {
      run();
    }
  })
  .catch(console.error);
})();

function extract(feedObject) {
  if (!feedObject) return;
  console.log('Extract object with guid', feedObject.guid);
  return eventize(feedObject).then(() => feedObject);
}

function eventize(feedObject) {
  // TODO: obj.description ok? is it truncated in some feeds? etc.
  var extractType = _.capitalize(feedObject.extractType);
  return entityExtractor['eventizeWith' +
    extractType](feedObject.description,
      { date: feedObject.pubdate, mimeType: 'text/html' });
}

function markAsProcessed(feedObject) {
  if (!feedObject) {
    return;
  } else {
    console.log('Processing:', feedObject);
    return feedObject.updateAttributes({processed: true});
  }
}
