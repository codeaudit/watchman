"use strict";
var FeedParser = require('feedparser')
    , request = require('request');


module.exports = class RssFeedProcessor{

    constructor(textFeed){
        this.textFeedUrl = textFeed.url;
    }

    startFeed(){
        var rssFeedProcessor = this;
        this.intervalId = setInterval(function(){rssFeedProcessor.processFeed(rssFeedProcessor)},1000 * 5);
    }

    stopFeed(){
        clearInterval(this.intervalId);
    }

    processFeed(rssFeedProcessor){
        var feedParser = new FeedParser();
        feedParser.on('readable',rssFeedProcessor.processFeedReadable);
        request.get(rssFeedProcessor.textFeedUrl)
            .on('error',function(error) {
                if (error) {
                    console.log("error processing feed " + rssFeedProcessor.textFeedUrl);
                    return;
                }
            }).pipe(feedParser);
    }

    processFeedReadable(){
        var item;
        while (item = this.read()) {
            request.post({
                url:  "http://localhost:3001/api/extract/process",
                body:{dataString:item.description},
                json:true
            }, function (error) {
                if (error) {
                    console.log("error creating event: " + error);
                }
            });
        }
    }
};
