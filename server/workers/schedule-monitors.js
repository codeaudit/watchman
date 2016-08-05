// def: trigger job monitors on a schedule

'use strict';

require('dotenv').config({silent: true});

const app = require('../server'),
  _ = require('lodash'),
  moment = require('moment'),
  JobMonitor = app.models.JobMonitor,
  FeaturizeMonitor = require('../../lib/job-monitors/featurize-monitor'),
  ClusterizeMonitor = require('../../lib/job-monitors/clusterize-monitor'),
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
  const params = {
    // start_time: now - QUERY_SPAN_MINS * 60 * 1000,
    // end_time: now,
    start_time: 1469695563000,
    end_time: 1469702566000,
    featurizer: 'text',
  };

  JobMonitor.findOrCreate({ where: params }, params)
  .then(jobMonitor => {
    jobMonitor = jobMonitor[0]; //why array here?
    const fMonitor = new FeaturizeMonitor(jobMonitor);
    const cMonitor = new ClusterizeMonitor(jobMonitor);

    fMonitor.start();

    fMonitor.on('featurized', onFeaturized);
    cMonitor.on('done', onDone);

    function onFeaturized() {
      updateAttributes({state: 'featurized'});
      cMonitor.start();
    }

    function onDone() {
      updateAttributes({state: 'done', done_at: new Date()});
    }

    function updateAttributes(attrs) {
      jobMonitor
      .updateAttributes(attrs)
      .catch(err => console.error(err.stack));
    }
  })
  .catch(err => console.error(err.stack));
}
