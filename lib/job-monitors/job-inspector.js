'use strict';

const redis = require('../redis'),
  _ = require('lodash')
;

// def: inspect running jobs via redis and handle output
module.exports = class JobInspector {
  constructor(args) {
    this.key = args.key;
    this.queue = args.queue;
    this.onComplete = args.onComplete;
  }

  run() {
    return redis.hgetall(this.key)
    .then(data => {
      if (!data) {
        console.log('%s not found', this.key);
        this.queue.delete(this.key);
      } else if (data.state === 'processed') {
        if (_.isEmpty(data.data)) {
          console.error('%s is missing data', this.key);
        } else {
          console.log('%s processed', this.key);
          this.onComplete(this.key, JSON.parse(data.data));
        }
        this.queue.delete(this.key);
        redis.del(this.key); //good citizen cleanup
      } else if (data.state === 'error') {
        console.error('%s reported an error: %s', this.key, data.error);
        this.queue.delete(this.key);
        redis.del(this.key); //good citizen cleanup
      } else {
        console.log('not finished: %s state: %s', this.key, data.state);
      }
    })
    .catch(err => {
      console.error('polling err for %s', this.key, err, err.stack);
      this.queue.delete(this.key);
    });
  }
};




