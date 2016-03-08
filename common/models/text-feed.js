"use strict";

var textFeedList = [];

module.exports = function(TextFeed) {

  TextFeed.startFeeds = function(req,res, cb) {
    if(textFeedList.length > 0){
      cb(null, "Please stop the current feeds before starting new ones.");
      return;
    }

    TextFeed.find().then(function(feeds){
      var FeedClass, textFeed;
      //expects textfeed.feedType to match feed-processors/ file names
      feeds.forEach(function(feed){
        FeedClass = require('../../server/feed-processors/' + feed.feedType.toLowerCase() + '.js');
        textFeed = new FeedClass(feed);
        textFeedList.push(textFeed);
        textFeed.startFeed();
      })
    });

    cb(null,{data: 'started'});
  };

  TextFeed.remoteMethod(
    'startFeeds',
    {
      accepts: [
        {arg: 'req', type: 'object', 'http': {source: 'req'}},
        {arg: 'res', type: 'object', 'http': {source: 'res'}}
      ],
      returns: {arg: 'data', root:true},
      http: {path: '/start',verb: 'get'}
    }
  );

  TextFeed.stopFeeds = function(req,res, cb) {
    textFeedList.forEach(function(feed){
      feed.stopFeed();
    });

    textFeedList.length=0;

    cb(null,{data: 'stopped'});
  };

  TextFeed.remoteMethod(
    'stopFeeds',
    {
      accepts: [
        {arg: 'req', type: 'object', 'http': {source: 'req'}},
        {arg: 'res', type: 'object', 'http': {source: 'res'}}
      ],
      returns: {arg: 'data', root:true},
      http: {path: '/stop',verb: 'get'}
    }
  );



  TextFeed.destroyData = function(req,res, cb) {

    TextFeed.destroyAll();

    cb(null,'All data destroyed.');
  };

  TextFeed.remoteMethod(
    'destroyData',
    {
      accepts: [
        {arg: 'req', type: 'object', 'http': {source: 'req'}},
        {arg: 'res', type: 'object', 'http': {source: 'res'}}
      ],
      returns: {arg: 'data', root:true},
      http: {path: '/destroy',verb: 'get'}
    }
  );
};
