'use strict';

const app = require('../server/server'),
  redis = require('./redis'),
  _ = require('lodash');

module.exports = {
  status(id) {
    return redis.hgetall(id)
    .then(data => _.pick(data, ['state', 'data']));
  }
};
