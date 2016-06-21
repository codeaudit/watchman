'use strict';

const jobs = require('../../lib/jobs');

module.exports = function(Job) {

  Job.remoteMethod(
    'status',
    {
      description: 'Returns job status and data, if complete',
      accepts: {
        arg: 'args',
        type: 'object',
        description: 'object with properties "job_id"',
        required: true,
        http: { source: 'body' }
      },
      returns: {type: 'object', root: true},
      http: {path: '/status', verb: 'post'}
    }
  );

  Job.status = function(args, cb) {
    var jobId = args.job_id;

    jobs.status(jobId)
    .then(data => cb(null, data))
    .catch(err => cb(err));
  };
};
