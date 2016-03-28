'use strict';
var request = require('request')
  , feedq = require('../../lib/feed-q')
  , moment = require('moment')
  , lastFeedTime = "";


module.exports = class TrackerFeedProcessor{

  constructor(textFeed){
    this.textFeed = textFeed;
    this.setLastFeedTime();

  }

  setLastFeedTime(){
    lastFeedTime = moment().utc().format().toString();
    lastFeedTime = lastFeedTime.substring(0,lastFeedTime.length-6);
    lastFeedTime = "2016-03-22T12:00:00";
  }

  process(){
    var context = this;
    var url = this.textFeed.url + "&last_request_time=" + lastFeedTime.toString();

    request(url, function (err, response, body) {
      if (err) {
        console.error('error processing feed', context.textFeed.url, err);
        return;
      }
      context.processFeedReadable(body);
    });

    this.setLastFeedTime();
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

      for (var user in data) {
        if (data.hasOwnProperty(user)) {
          for (var tweet in data[user]) {
            if (data[user].hasOwnProperty(tweet)) {
              var feedObj = {};
              feedObj.description = data[user][tweet].text;
              feedObj.guid=this.guid();
              feedObj.extractType = this.textFeed.extractType;
              feedq.add(feedObj);
            }
          }
        }
      }

    }
    catch(err){
      console.log(err);
    }

  }
};
