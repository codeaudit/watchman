// def: trigger job monitors on a schedule

'use strict';

require('dotenv').config({silent: true});

const app = require('../server'),
  _ = require('lodash'),
  moment = require('moment'),
  JobMonitor = app.models.JobMonitor,
  EventedMonitor = require('../../lib/job-monitors/evented-monitor'),
  QUERY_SPAN_MINS = 10
;


const worker = module.exports = {
  start() {
    run();
  }
};

// start if run as a worker process
if (require.main === module)
  worker.start();

function run() {
  const now = Date.now(); // ms

  JobMonitor.create({
    start_time: now - QUERY_SPAN_MINS * 60 * 1000,
    end_time: now,
    featurizer: 'text',
    state: 'new'
  })
  .then(jobMonitor => {
    const monit = new EventedMonitor(jobMonitor);

    monit.start();

    monit.on('done', onDone);

    function onDone() {
      jobMonitor
      .updateAttributes({state: 'done', done_at: new Date()})
      .catch(console.error);
    }
  })
  .catch(console.error);
}
