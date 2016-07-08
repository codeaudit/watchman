#!/usr/bin/env node

// def: trigger featurizer jobs and get results from redis

'use strict';

const es = require('elasticsearch'),
  request = require('request'),
  destClient = new es.Client({
    host: 'elasticsearch:9200',
    requestTimeout: 60000,
    log: 'error'
  }),
  destIndex = 'stream',
  destType = 'tweet'
  ;

const fs = require('fs'),
  path = require('path'),
  redis = require('./redis'),
  _ = require('lodash'),
  dir = require('node-dir'),
  imagesDir = path.join('/tmp', destIndex, destType),
  POLL_WAIT = 20 // seconds
;

let queue = new Set();

console.log('Polling for images in %s', imagesDir);

run();

function run() {
  prep()
  .then(getFiles)
  .then(() => {
    setTimeout(run, POLL_WAIT * 1000);  // poll for new files
    console.log('Pausing featurizer for %d sec ...', POLL_WAIT);
  })
  .catch(console.error);
}

// kickoff secondary process to save featurizer results
setInterval(pollResults, POLL_WAIT * 1000);

function prep() {
  return Promise.resolve();
}

function getFiles() {
  return new Promise((res, rej) => {
    dir.readFilesStream(imagesDir,
      { match: /\.jpg$/ },
      (err, stream, next) => {
        if (err) return rej(err);
        triggerFeaturizer(stream.path)
        .then(key => queue.add(key))
        .then(() => next())
        .catch(err => {
          console.error(err);
          next();
        });
      },
      (err, files) => {
        if (err) return rej(err);
        if (process.env.NODE_ENV === 'production')
          files.forEach(f => fs.renameSync(f, f + '~')); // mark completed
        return res();
      }
    );
  });
}

function getFeaturizerKey(id) {
  return 'features:' + id;
}

function triggerFeaturizer(filePath) {
  const key = getFeaturizerKey(getBasename(filePath));
  return Promise.all([
    redis.hmset(key, { path: filePath, state: 'downloaded' }),
    redis.publish('features', key)
  ])
  .then(() => key); // return key
}

function pollResults() {
  console.log('polling for featurizer results');
  queue.forEach(key => {
    redis.hgetall(key)
    .then(data => {
      if (!data) {
        console.log('%s not found', key);
        queue.delete(key);
      } else if (data.state === 'processed') {
        saveFeatures(data);
        queue.delete(key);
      } else if (data.state === 'error') {
        console.log('%s reported an error: %s', key, data.error);
        queue.delete(key);
      } else {
        console.log('%s state: %s', key, data.state);
      }
    })
    .catch(err => {
      console.error('polling err for item %s', key, err);
      queue.delete(key);
    });
  });
}

function saveFeatures(data) {
  return destClient.update({
    index: destIndex,
    type: destType,
    body: { features: data.data }
  })
  .then(() => console.log('features saved for %s', data.path));
}

// file basename less file ext.
function getBasename(filePath) {
  const parts = path.basename(filePath).split('.');
  return parts.slice(0, parts.length - 1);
}
