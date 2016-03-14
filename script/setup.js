#!/usr/bin/env node

'use strict';

const app = require('../server/server');
const TextFeed = app.models.TextFeed;
const FeedObject = app.models.FeedObject;
const ParsedEvent = app.models.ParsedEvent;

const textFeed = {
  url: 'http://spdblotter.seattle.gov/feed/',
  extractType: 'stanford'
};

TextFeed.findOrCreate({where: textFeed}, textFeed)
.then(() => FeedObject.destroyAll())
.then(() => ParsedEvent.destroyAll())
.then(() => console.log('✔ done'))
.catch(console.error)
