"use strict";
var FeedParser = require('feedparser')
  , request = require('request')
  , feedq = require('../../lib/feed-q');


module.exports = class RssFeedProcessor{

  constructor(textFeed){
    this.textFeedUrl = textFeed.url;
  }

  startFeed(){
    this.intervalId = setInterval(this.processFeed.bind(this), 1000 * 15);
  }

  stopFeed(){
    clearInterval(this.intervalId);
  }

  processFeed(){
    var context = this;
    var feedParser = new FeedParser();
    feedParser.on('readable', this.processFeedReadable);
    request.get(this.textFeedUrl)
      .on('error', function(err) {
        if (err) {
          console.error("error processing feed", context.textFeedUrl, err);
          return;
        }
      })
      .pipe(feedParser);
  }

  processFeedReadable(){
    var item;
    while (item = this.read()) {
      feedq.add(item);
    }
  }
};
