// def: parse rss feeds and store data
'use strict';

const app = require('../../server/server');
const INTERVAL = 15; // seconds
const _ = require('lodash');
let runningFeedIds = []; //already running

var worker = module.exports = {
  start: function() {
    const TextFeed = app.models.TextFeed;
    run();
    // periodically check for new TextFeed sources
    setInterval(run, 60 * 1000);

    function run() {
      TextFeed.find()
      .then(process)
      .catch(console.error);
    }
  }
}

// start if run as a worker process
if (require.main === module)
  worker.start();

function process(feeds) {
  // stop if nothing changed or no feeds in db
  if (!feeds.length || (feeds.length === runningFeedIds.length)) {
    return;
  } else {
    let FeedClass, processor;
    //expects textfeed.feedType to match feed-processors/ file names
    feeds.forEach(feed => {
      console.log('found', feed.url);
      if (!_.includes(runningFeedIds, feed.id)) {
        console.log('processing', feed.url);
        FeedClass = require('../feed-processors/' + feed.feedType.toLowerCase() + '.js');
        processor = new FeedClass(feed);

        // periodically check for new feed items
        setInterval(processor.process.bind(processor), 1000 * INTERVAL);
        runningFeedIds.push(feed.id);
      }
    });
  }
}
