// def: parse rss feeds and store data
'use strict';

const app = require('../../server/server');
const WAIT_SECS = 15;
const _ = require('lodash');
let runningFeeds = []; //already running

var worker = module.exports = {
  start: function() {
    const TextFeed = app.models.TextFeed;
    (function recurse() {
      TextFeed.find()
      .then(process)
      .then(recurse)
      .catch(console.error);
    })()
  }
}

// start if run as a worker process
if (require.main === module)
  worker.start();

function process(feeds) {
  // take a break if nothing changed or no feeds in db
  if (!feeds.length || (feeds.length == runningFeeds.length)) {
    return new Promise((resolve, _) => {
      setTimeout(resolve, WAIT_SECS * 1000);
    });
  } else {
    let FeedClass, processor;
    //expects textfeed.feedType to match feed-processors/ file names
    feeds.forEach(feed => {
      console.log('found', feed.url);
      if (!_.includes(runningFeeds, feed.id)) {
        console.log('processing', feed.url);
        FeedClass = require('../feed-processors/' + feed.feedType.toLowerCase() + '.js');
        processor = new FeedClass(feed);

        // looping for new feed items
        setInterval(processor.process.bind(processor), 1000 * WAIT_SECS);
        runningFeeds.push(feed.id);
      }
    });
  }
}
