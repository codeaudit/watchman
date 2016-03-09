"use strict";
var FeedParser = require('feedparser')
  , request = require('request')
  , DelayedStream = require('delayed-stream')
  , queue = require('queue');


module.exports = class RssFeedProcessor{

  constructor(textFeed){
    this.textFeedUrl = textFeed.url;
    this.queue = queue();
    this.queue.concurrency=2;

  }

  startFeed(){
    this.intervalId = setInterval(this.processFeed.bind(this), 1000 * 5);
  }

  stopFeed(){
    clearInterval(this.intervalId);
  }

  processFeed(){
    var context = this;
    var feedParser = new FeedParser();
    feedParser.on('readable',function(){this.processFeedReadable(this)});
    request.get(this.textFeedUrl)
      .on('error',function(err) {
        if (err) {
          console.error("error processing feed", context.textFeedUrl, err);
        }
      })
      .on('response', function(res) {
        if (res.statusCode != 200) return this.emit('error', new Error('Bad status code'));
        var delayed = DelayedStream.create(res);
        // slow down the stream for NER to catch up
        setTimeout(
          function() {
            delayed.pipe(feedParser);
          },
          5000);
      });
      // .pipe(feedParser);
  }

  processFeedReadable(rssFeedProcessor){
    var item;
    while (item = this.read()) {
      if(!item || !item.description){return;}

      rssFeedProcessor.queue.push(function() {
        request.post({
          url: "http://localhost:3001/api/extract/process",
          body: {dataString: item.description},
          json: true
        }, function (err) {
          if (err) {
            console.error("error creating event:", err);
          }
        });
      });
    }
    rssFeedProcessor.queue.start();
  }
};
