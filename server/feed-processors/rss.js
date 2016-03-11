"use strict";
var FeedParser = require('feedparser')
  , request = require('request')
  , feedq = require('../../lib/feed-q');


module.exports = class RssFeedProcessor{

  constructor(textFeed){
    this.textFeed = textFeed;
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
    feedParser.on('readable', this.processFeedReadable(this.textFeed));
    request.get(this.textFeed.url)
      .on('error', function(err) {
        if (err) {
          console.error("error processing feed", context.textFeed.url, err);
          return;
        }
      })
      .pipe(feedParser);
  }

  processFeedReadable(textFeed){
    return function() {
      var item;
      while (item = this.read()) {
        item.extractType = textFeed.extractType; // pass-thru to feed q
        feedq.add(item);
      }
    }
  }
};
