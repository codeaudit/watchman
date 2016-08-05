'use strict';

const app = require('../../server/server'),
  SocialMediaPost = app.models.SocialMediaPost,
  EventedMonitor = require('./evented-monitor'),
  redis = require('../redis'),
  _ = require('lodash'),
  idGen = require('../id-generator'),
  util = require('util')
;

// def: subclassed monitor for handling clusterizer jobs
class ClusterizeMonitor extends EventedMonitor {
  constructor(jobMonitor) {
    super(jobMonitor);
    this.initialState = 'featurized';
    this.onJobComplete = onJobComplete;
  }

  start() {
    if (this.state === 'done') return;
    super.start();
  }

  submitJobs() {
    const key = this.jobPrefix + 'cluster:' + idGen.randomish();
    let channel_name = this.jobPrefix;
    let queryUrl = util.format('%s/socialMediaPosts',
      process.env.API_ROOT);
    let resultUrl = util.format('%s/clusters',
      process.env.API_ROOT);

    let jobAttrs = {
      state: 'new',
      query_url: queryUrl,
      result_url: resultUrl,
      similarity_threshold: 0.8, //TODO
      similarity_method: 'custom', //TODO
      start_time_ms: this.start_time,
      end_time_ms: this.end_time,
      lang: this.lang,
      data_type: this.featurizer
    };
    // TODO
    channel_name += 'clust_txt';

    return redis
    .hmset(key, jobAttrs)
    .then(() => redis.publish(channel_name, key))
    .then(() => this.set.add(key))
    .then(() => console.info('%s submitted', key))
    .catch(err => console.error(key, err, err.stack));
  }
}

//TODO
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

module.exports = ClusterizeMonitor;
