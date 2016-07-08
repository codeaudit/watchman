#!/usr/bin/env node

// def: parses newline-delimited twitter json files, saves images to disk,
// saves tweets to ES.

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
  url = require('url'),
  path = require('path'),
  mkdirp = require('mkdirp'),
  dataMapping = require('./data-mapping'),
  readline = require('readline'),
  _ = require('lodash'),
  dir = require('node-dir'),
  queuedFilesPath = '/tmp/processing',
  imagesDir = path.join('/tmp', destIndex, destType),
  POLL_WAIT = 60 // seconds
;

let images = [] // cached while processing
;

console.log('Waiting for files in %s', queuedFilesPath);
console.log('Saving images in %s', imagesDir);

run();

function run() {
  prep()
  .then(process)
  .then(bulkIndex)
  .then(() => saveImages(images))
  .then(() => {
    setTimeout(run, POLL_WAIT * 1000);  // poll for new files
    console.log('Pausing processor for %d sec ...', POLL_WAIT);
  })
  .catch(console.error);
}

function prep() {
  images = [];

  return dataMapping.createIndexWithMapping({
    client: destClient, index: destIndex, type: destType, mapping: {}
  });
}

function process() {
  let bulkLines = [];
  mkdirp.sync(queuedFilesPath);

  return new Promise((res, rej) => {
    dir.readFilesStream(queuedFilesPath,
      { match: /\.json$/ },
      (err, stream, next) => {
        if (err) return rej(err);
        const lineReader = readline.createInterface({
          input: stream,
          terminal: false
        });

        lineReader
        .on('line', line => {
          let altered = alterTweet(line);
          if (altered) {
            console.log(altered);
            // TODO: would be better to stream
            bulkLines.push(JSON.stringify({ create: { _id: altered.id } }));
            bulkLines.push(JSON.stringify(altered));
            // TODO: would be better to stream
            images.push({
              basename: altered.id,
              url: altered.images[0].url
            });
          }
        })
        .on('close', () => next())
        .on('error', err => { throw err; })
        ;
      },
      (err, files) => {
        if (err) return rej(err);
        // files.forEach(f => fs.renameSync(f, f + '~')); // mark completed
        return res(bulkLines);
      }
    );
  });
}

function bulkIndex(lines) {
  if (!lines || !lines.length) return;
  return destClient.bulk({
    index: destIndex,
    type: destType,
    body: lines.join('\n')
  });
}

function alterTweet(line) {
  let altered = JSON.parse(line);

  // entities.media[0].media_url uses default size
  let imageUrl = _.get(altered, 'entities.media[0].media_url') ||
                 _.get(altered, 'instagram.img_url');

  // must have a pic
  if (!imageUrl) return;

  altered.id = altered.id_str; // make sure ==
  altered.images = []; // add generic prop to record
  altered.images.push({ url: imageUrl });
  return altered;
}

// assumes image url has file ext in path.
// sandbox requires .jpg files in regex checks.
function saveImages(images) {
  mkdirp.sync(imagesDir);
  const BATCH_SIZE = 50;

  // save in chunks with a built-in delay to bypass
  // file handler limits, request limits, etc.
  return Promise.all(_(images).chunk(BATCH_SIZE).map(batchSave))
  .catch(console.error);

  function batchSave(images) {
    let imageRequests = images.map(saveImage).concat(slowdown());
    return Promise.all(imageRequests)
    .then(() => console.log('Saving images...'))
    ;
  }
}

function getFilePath(image) {
  const parsed = url.parse(image.url);
  const pathParts = parsed.pathname.split('.');
  const ext = '.' + pathParts[pathParts.length-1];
  const imagePath = path.join(imagesDir, image.basename) + ext;
  return imagePath;
}

function saveImage(image) {
  return new Promise((res, rej) => {
    const imagePath = getFilePath(image);
    const imageStream = fs.createWriteStream(imagePath);
    const imageReq = request(image.url);

    imageStream
      .on('finish', () => res())
      .on('error', err => {
        fs.unlink(imagePath);
        rej(err);
      });

    imageReq
      .on('error', err => {
        console.error(err);
        fs.unlink(imagePath);
      });

    imageReq.pipe(imageStream);
  });
}

// arbitrary slowdown to ease http requests
function slowdown(interval) {
  interval = interval || 5000;
  return new Promise(res => {
    setTimeout(res, interval);
  });
}
