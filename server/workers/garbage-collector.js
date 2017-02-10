'use strict';

// def: start and monitor job sets

const app = require('../server'),
  debug = require('debug')('job-scheduler'),
  _ = require('lodash');

try {
  require('dotenv').config({silent: true});
} catch(ex) {}

const API_ROOT = process.env.API_ROOT;
if (!API_ROOT) {
  throw new Error('Missing required API_ROOT env var');
}
const KEEP_TIME_MS = process.env.KEEP_TIME_MS|20*60000;//604800000;
const COLLECT_INTERVAL_TIME_MS = process.env.COLLECT_INTERVAL_TIME_MS|10000;//3600000;
const MODELS = process.env.MODELS||'SocialMediaPost';//,PostsCluster,JobSet,JobMonitor';
const modelList = MODELS.split(',');

module.exports = { start };

// start if run as a worker process
if (require.main === module)
  start();

function start() {
  schedule()
}

function schedule() {
  collectGarbage(modelList);
  reschedule();
  function reschedule() {
    setTimeout(() => schedule(), COLLECT_INTERVAL_TIME_MS);
  }
}


function cleanModel(modelName) {
  let latestParams = {
    order:'created DESC',
    limit:1,
    fields: {'id': true, 'created': true, 'system_created':true}
  };

  let model = app.models[modelName];
  return model.find(latestParams)
    .then( instance=> {
      if(!instance || instance.length == 0)
        return null;

      let latest = instance[0].created ?instance[0].created.getTime(): instance[0].system_created.getTime();
      let keepThreshold = latest - KEEP_TIME_MS;

      let rangeParams = {
        created:{lt:new Date(keepThreshold)},
        fields: {'id': true, 'created': true}
      };
      return rangeParams;
    })
    .then(rangeParams=>{
        model.find(rangeParams)
    })
    .then(instances => {
      if(!instances)return null;
      console.log(instances);
      return Promise.all(instances.map(instance=>{return model.destroyById(instance.id)}));
    })
}

function collectGarbage(models) {

  return Promise.all(models.map(cleanModel));

}
