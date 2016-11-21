'use strict';

const _ = require('lodash'),
  preprocessor = require('../../lib/preprocessors/twitter');

// def: QCR endpoint to inspect post data
// and create SocialMediaPost entries.
module.exports = function(Qcr) {

  let bootTime = Date.now();
  let postPerSecondCount = 0;
  let qcrFilterThreshold = 0;
  let globalHackyPostFilterCount = 0;

  Qcr.setFilter = function(filter, cb) {
    //should we have to parse this?
    let f = JSON.parse(filter);
    qcrFilterThreshold = +f.filter;
    //reset counters and start time for pps calculation
    globalHackyPostFilterCount = 0;
    postPerSecondCount = 0;
    bootTime = Date.now();
    if(f.filter === 0)
      console.log('Filter off!');
    else
      console.log('Keeping 1 out of every ' + f.filter + ' posts');
    cb(null, 'Post Filter set to: ' + f.filter);
  };

  Qcr.remoteMethod('setFilter', {
    accepts: {arg: 'filter', type: 'string'},
    returns: {arg: 'result', type: 'string'}
  });

  Qcr.remoteMethod(
    'insert',
    {
      description: 'QCR endpoint to receive posts',
      http: { path: '/insert', verb: 'post' },
      accepts: {
        arg: 'req',
        type: 'object',
        description: 'the post data',
        http: { source: 'req' }
      },
      returns: { type: 'object', root: true }
    }
  );

  setInterval(function(){
      console.log('--==PPS==--:' + postPerSecondCount / ((Date.now() - bootTime)/1000));
    if(qcrFilterThreshold)
      console.log("--==FPPS==--:" + globalHackyPostFilterCount / ((Date.now() - bootTime)/1000));
  },5000);

  Qcr.insert = function(req, cb) {
    const attrs = req.body;

    //Calculating our posts per second so we get a real amount to deal with
    postPerSecondCount ++;
    // stop the deluge
    if (+process.env.IGNORE_QCR) {
      return cb(null, attrs); // send 200 code and stop
    }

    //TODO: either make our system scale correctly or fix this to be less hacky!
    if (qcrFilterThreshold && postPerSecondCount % qcrFilterThreshold != 0) {
      return cb(null, attrs); // send 200 code and stop
    }
    else{
      globalHackyPostFilterCount++;
    }


    //TODO: END either make our system scale correctly or fix this to be less hacky!

    let qcrData = new Qcr(attrs);

    qcrData.isValid(valid => {
      valid ? save(attrs, cb) : cb(qcrData.errors);
    });
  };

  function save(attrs, cb) {
    const SocialMediaPost = Qcr.app.models.SocialMediaPost;

    let createActions = [],
      processedAttrs = {};

    _.merge(processedAttrs, attrs);

    // QCR-specific modifications
    processedAttrs.state = 'new';
    processedAttrs.timestamp_ms = +(new Date(attrs.timestamp_ms));
    processedAttrs.text = attrs.text || '';
    processedAttrs.image_urls = attrs.image_urls || [];
    processedAttrs.hashtags = attrs.hashtags || [];

    // Twitter-specific modifications
    processedAttrs = preprocessor(processedAttrs);
    delete processedAttrs.quoted_status;

    if (processedAttrs.text.length > 0) {
      processedAttrs.featurizer = 'text';
      createActions.push(SocialMediaPost.create(processedAttrs));
    }
    if (processedAttrs.image_urls.length > 0) {
      processedAttrs.featurizer = 'image';
      createActions.push(SocialMediaPost.create(processedAttrs));
    }
    if (processedAttrs.hashtags.length > 0) {
      processedAttrs.featurizer = 'hashtag';
      createActions.push(SocialMediaPost.create(processedAttrs));
    }

    // returns default 200 for everything.
    // if nil text, hashtags, and images just forget about it.
    Promise.all(createActions)
    .then(() => cb(null, attrs)) // echo input
    .catch(err => {
      // QCR re-sends tweets on 5xx (server error) http response codes.
      // b/c they send lots of dupe tweets, we get mongo uniq idx failures.
      // ignore them.
      console.error('QCR err:', err);
      cb(null, {ok: 1}); // send bogus 200 response
    });
  }

};
