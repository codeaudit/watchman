'use strict';

var app = require('../server/server');
var FeedObject = app.models.FeedObject;

module.exports = {
  add: obj => {
    FeedObject.findOrCreate({guid: obj.guid}, obj)
    .then(console.log)
    .catch(console.error);
  }
}
