'use strict';

const EventedMonitor = require('./evented-monitor'),
  redis = require('../redis'),
  _ = require('lodash'),
  idGen = require('../id-generator'),
  util = require('util'),
  SIM_THRESHOLD = process.env.SIMILARITY_THRESHOLD || 0.5,
  SIM_METHOD = process.env.SIMILARITY_METHOD || 'custom',
  API_ROOT = process.env.API_ROOT
;

if (!API_ROOT) throw new Error('undefined API_ROOT env var');

// def: subclassed monitor for handling clusterizer jobs
class ClusterizeMonitor extends EventedMonitor {
  constructor(jobMonitor, app) {
    super(jobMonitor, app);
    this.initialState = 'featurized';
    this.finalState = 'done';
    this.keyPrefix = this.jobPrefix + 'cluster:';
  }

  submitJobs() {
    const key = this.keyPrefix + idGen.randomish();
    let channelName = this.jobPrefix;
    let queryUrl = util.format('%s/socialmediaposts/', API_ROOT);
    let resultUrl = util.format('%s/postsclusters/', API_ROOT);

    let jobAttrs = {
      state: 'new',
      job_id: this.id,
      query_url: queryUrl,
      result_url: resultUrl,
      similarity_threshold: SIM_THRESHOLD,
      similarity_method: SIM_METHOD,
      start_time_ms: this.start_time,
      end_time_ms: this.end_time,
      lang: this.lang,
      data_type: this.featurizer
    };

    if (this.featurizer === 'text')
      channelName += 'clust_txt';
    else if (this.featurizer === 'image')
      channelName += 'clust_img';
    else if (this.featurizer === 'hashtag')
      channelName += 'clust_hash';
    else
      throw new Error('unknown featurizer');

    return redis
    .hmset(key, jobAttrs)
    .then(() => redis.publish(channelName, key))
    .then(() => this.queue.add(key))
    .then(() => console.info('%s submitted', key))
    .catch(err => console.error(key, err, err.stack));
  }

  onJobComplete(key, output) {
    // clustering service updates postsclusters so
    // nothing to do here.
  }
}

module.exports = ClusterizeMonitor;
