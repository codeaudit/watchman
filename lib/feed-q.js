'use strict';

var app = require('../server/server');
var FeedObject = app.models.FeedObject;

module.exports = {
  // obj: any object with a guid and extractType
  add: obj => {
    return FeedObject.findOrCreate(
      { where: { guid: obj.guid, extractType: obj.extractType } },
      obj)
    // .then(console.log)
    .catch(console.error);
  }
}
