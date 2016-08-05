'use strict';

const app = require('../../server/server'),
  SocialMediaPost = app.models.SocialMediaPost,
  EventedMonitor = require('./evented-monitor'),
  redis = require('../redis'),
  _ = require('lodash')
;

// def: subclassed monitor for handling featurizer jobs
class FeaturizeMonitor extends EventedMonitor {
  constructor(jobMonitor) {
    super(jobMonitor);
    this.initialState = 'new';
    this.onJobComplete = onJobComplete;
  }

  start() {
    if (this.state === 'featurized') return;
    super.start();
  }

  submitJobs() {
    const PER_PAGE = 50,
      context = this;
    let _count = 0;

    SocialMediaPost.count(this.getQueryFilter())
    .then(count => {
      console.info('found %d posts to submit', count);
      return count;
    })
    .then(page)
    .catch(err => console.error(err, err.stack));;

    function page(count) {
      if (_count >= count) return;

      return SocialMediaPost
      .find({
        where: context.getQueryFilter(),
        order: 'id asc',
        skip: _count, limit: PER_PAGE
      })
      .then(posts => {
        _count += posts.length;
        posts.forEach(post => {
          context._submit(post)
        });
      })
      .then(() => page(count));
    }
  }

  _submit(post) {
    const key = this.jobPrefix + 'feature:' + post.post_id;
    let jobAttrs, channel_name = this.jobPrefix;
    // TODO: channel_name
    switch(this.featurizer) {
      case 'image':
        jobAttrs = { state: 'downloaded' };
        channel_name += 'feature_img';
        break;
      case 'text':
        jobAttrs = { state: 'new', txt: post.text, lang: post.lang };
        channel_name += 'feature_txt';
        break;
      default:
        throw new Error('unknown featurizer');
    }

    return redis
    .hmset(key, jobAttrs)
    .then(() => redis.publish(channel_name, key))
    .then(() => this.set.add(key))
    .then(() => console.info('%s submitted', key))
    .catch(err => console.error(key, err, err.stack));
  }
}

function onJobComplete(args) {
  return (key, output) => {
    let updateAttrs;
    switch(args.featurizer) {
      case 'image':
        updateAttrs = { image_features: output };
        break;
      case 'text':
        updateAttrs = { text_features: output };
        break;
      default:
        throw new Error('unknown featurizer');
    }
    //TODO: query post_type also
    SocialMediaPost
    .updateAll({ post_id: key }, updateAttrs)
    .catch(err => console.error(err, err.stack));
  }
}

module.exports = FeaturizeMonitor;
