'use strict';

const EventEmitter = require('events').EventEmitter,
  app = require('../../server/server'),
  SocialMediaPost = app.models.SocialMediaPost,
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
    this.lang = jobMonitor.lang;
    this.state = jobMonitor.state; // mutable state
    this.initialState = null; // set by subclass
    this.onJobComplete = () => console.log('see subclass');
    this.set = new EventedSet();
    this.jobPrefix = 'genie:';
  }

  start() {
    if (this.state === this.initialState) {
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

  reset() {
    let prevState = this.state;
    this.state = this.getNextState(prevState);

    console.info('monitor %s changed from %s to %s',
      this.id.toString(), prevState, this.state);

    SocialMediaPost
    .updateAll(this.getQueryFilter(prevState), { state: this.state })
    .then(() => {
      this.emit(this.state);
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
          onComplete: this.onJobComplete({featurizer: this.featurizer})
        });
        return inspector.run();
      })
    );
  }
}

module.exports = EventedMonitor;
