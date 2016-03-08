'use strict';

// var env = process.env.NODE_ENV || 'development';
// if (env === 'development') {
//   require('dotenv').load();
// }

var app = require('../../server/server');
var models = app.models;
var TextFeed = models.TextFeed;
var kue = require('kue');
var _ = require('lodash');

function start() {
  var queue = kue.createQueue({
    jobEvents: false
    //, redis: process.env.REDIS_URL
  });

  queue
  .on('job complete', id => {
    console.log('Job complete:', id);
  })
  .on('job failed attempt', (err, count) => {
    console.error('Job attempt (failed):', err, count);
  })
  .on('job failed', err => {
    console.error('Job failed:', err);
  });

  // Graceful shutdown
  process.once('SIGTERM', sig => {
    queue.shutdown(3000, err => {
      console.log('Kue shutdown: ', err || 'no error');
      process.exit(0);
    });
  });

  // process jobs
  queue.process('processTextFeeds', (job, done) => {
    processTextFeeds(job.data.options, done);
  });
}

function processTextFeeds(options, done) {
  TextFeed.find()
  .then(feeds => {
    return ;
  })
  .then(() => done())
  .catch(done);
}
