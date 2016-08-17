'use strict';

const _ = require('lodash');

// def: QCR endpoint to inspect post data
// and create SocialMediaPost entries.
module.exports = function(Qcr) {
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

  Qcr.insert = function(req, cb) {
    const attrs = req.body;
    // stop the deluge
    if (+process.env.IGNORE_QCR) {
      return cb(null, attrs); // send 200 code and stop
    }
    let qcrData = new Qcr(attrs);

    qcrData.isValid(valid => {
      valid ? save(attrs, cb) : cb(qcrData.errors);
    });
  };

  function save(attrs, cb) {
    const SocialMediaPost = Qcr.app.models.SocialMediaPost,
      createActions = [],
      postAttrs = {};

    _.merge(postAttrs, attrs);

    postAttrs.state = 'new';
    postAttrs.timestamp_ms = +(new Date(attrs.timestamp_ms));
    postAttrs.text = attrs.text || '';
    postAttrs.image_urls = attrs.image_urls || [];
    postAttrs.hashtags = attrs.hashtags || [];

    if (postAttrs.text.length > 0) {
      postAttrs.featurizer = 'text';
      createActions.push(SocialMediaPost.create(postAttrs));
    }
    if (postAttrs.image_urls.length > 0) {
      postAttrs.featurizer = 'image';
      createActions.push(SocialMediaPost.create(postAttrs));
    }
    if (postAttrs.hashtags.length > 0) {
      postAttrs.featurizer = 'hashtag';
      createActions.push(SocialMediaPost.create(postAttrs));
    }

    // returns default 200 for everything.
    // if nil text, hashtags, and images just forget about it.
    Promise.all(createActions)
    .then(() => cb(null, attrs)) // echo input
    .catch(cb);
  }

};
