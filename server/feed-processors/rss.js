"use strict";
var FeedParser = require('feedparser')
  , request = require('request')
  , DelayedStream = require('delayed-stream');


module.exports = class RssFeedProcessor{

  constructor(textFeed){
    this.textFeedUrl = textFeed.url;
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
    feedParser.on('readable',function()
    {
      context.processFeedReadable(feedParser);
    });
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
          0);
      });
      // .pipe(feedParser);
  }

  processFeedReadable(feedParser){
    var item;
    while (item = feedParser.read()) {
      if(!item || !item.description){return;}

      request.post({
          url: "http://localhost:3001/api/extract/process",
          body: {dataString: item.description},
          json: true
        }, function (err) {
          if (err) {
            console.error("error creating event:", err);
          }
        });
      }

  }
};
