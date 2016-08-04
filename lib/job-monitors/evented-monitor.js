'use strict';

const EventEmitter = require('events').EventEmitter,
  app = require('../../server/server'),
  SocialMediaPost = app.models.SocialMediaPost,
  util = require('util'),
  ptools = require('../promise-tools'),
  EventedSet = require('./evented-set'),
  JobInspector = require('./job-inspector'),
  redis = require('../redis'),
  _ = require('lodash'),
  WATCH_INTERVAL = 5 // secs;

// def: a job submitter and monitor for a given time period and featurizer type.
//    wraps a jobMonitor instance to provide event-based actions and state mgmt.
class EventedMonitor extends EventEmitter {
  constructor(jobMonitor) {
    super();
    this.jobMonitor = jobMonitor; // database object
    this.id = jobMonitor.id.toString();
    this.start_time = jobMonitor.start_time;
    this.end_time = jobMonitor.end_time;
    this.featurizer = jobMonitor.featurizer;
    this.state = jobMonitor.state || 'new';
    this.set = new EventedSet();
  }

  start() {
    if (this.state === 'done') return;
    if (this.state === 'new') {
      console.info('monitor %s started watching', this.id);
      // these run for lifetime of the monitor
      this.watchJobs();
      this.set.on('emptied', this.reset.bind(this));
    };

    this.submitJobs();
  }

  // TODO: rm 'en' filter
  getQueryFilter(state) {
    state = state || this.state;
    return {
      state: state,
      lang: 'en', // just english for now
      timestamp_ms: {
        between: [this.start_time.toString(), this.end_time.toString()]
      },
      featurizers: this.featurizer
    };
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
          context.submit(post)
        });
      })
      .then(() => page(count));
    }
  }

  reset() {
    let prevState = this.state;
    this.state = this.getNextState(prevState);

    console.info('monitor %s changed from %s to %s',
      this.id.toString(), prevState, this.state);

    SocialMediaPost
    .updateAll(this.getQueryFilter(prevState), { state: this.state })
    .then(() => {
      if (this.state === 'done')
        this.emit('done');
      else
        this.start();
    })
    .catch(err => console.error(err, err.stack));
  }

  getNextState(prevState) {
    switch (prevState || this.state) {
      case 'new':
        return 'featurized';
        break;
      case 'featurized':
        return 'done';
        break;
      // case 'clustered':
      //   return 'done';
      //   break;
      default:
        throw new Error('unknown monitor state for %s', this.id.toString());
    }
  }

  submit(post) {
    const key = post.post_id;
    let jobAttrs, channel_name;
    // TODO: channel_name
    if (this.state === 'new') { // for featurizing
      switch(this.featurizer) {
        case 'image':
          jobAttrs = { state: 'downloaded' };
          channel_name = 'features:image';
          break;
        case 'text':
          jobAttrs = { state: 'new', txt: post.text };
          channel_name = 'features:text';
          break;
        default:
          throw new Error('unknown featurizer');
      }
    } else if (this.state === 'featurized') { // for clustering
      switch(this.featurizer) {
        case 'image':
          jobAttrs = { state: 'new' };
          channel_name = 'clusters:image';
          break;
        case 'text':
          jobAttrs = { state: 'new' };
          channel_name = 'clusters:text';
          break;
        default:
          throw new Error('unknown featurizer');
      }
    } else {
      throw new Error('unknown state');
    }

    return redis
    .hmset(key, jobAttrs)  //TODO: get attrs from where?
    .then(() => redis.publish(channel_name, key))
    .then(() => this.set.add(key))
    .then(() => console.info('%s submitted', key))
    .catch(err => console.error(key, err, err.stack));
  }

  watchJobs() {
    this.checkAllJobs()
    .then(() => ptools.delay(WATCH_INTERVAL))
    .then(this.watchJobs.bind(this))
    .catch(err => console.error(err, err.stack));
  }

  checkAllJobs() {
    //TODO: lots of redis connections?
    return Promise.all(
      //TODO: rm Array.from
      Array.from(this.set.values()).map(key => {
        let inspector = new JobInspector({
          key,
          queue: this.set,
          onComplete: onJobComplete({featurizer: this.featurizer})
        });
        return inspector.run();
      })
    );
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

module.exports = EventedMonitor;
