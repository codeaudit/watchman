'use strict';
var request = require('request')
  , feedq = require('../../lib/feed-q')
  , lastFeedTime = 0;


module.exports = class TrackerFeedProcessor{

  constructor(textFeed){
    this.textFeed = textFeed;
  }

  process(){
    var context = this;
    request.get(this.textFeed.url + "&last_request_time=" + lastFeedTime.toString())
      .on('error', function(err) {
        if (err) {
          console.error('error processing feed', context.textFeed.url, err);
        }
      })
      .on('response', function(response) {
         context.processFeedReadable(response.body);
      });
    lastFeedTime = Date.now();
  }

  guid() {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
      s4() + '-' + s4() + s4() + s4();
  }

  processFeedReadable(jsonData){

    try{
      var data = JSON.parse(jsonData);
      data.forEach(tweet => {
        var feedObj = {};
        feedObj.description = tweet;
        feedObj.guid=this.guid();
        feedObj.extractType = this.textFeed.extractType;
        feedq.add(feedObj);
      });
    }
    catch(err){
      console.log(err);
    }

  }
};
