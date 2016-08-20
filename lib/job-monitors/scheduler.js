'use strict';

const request = require('request-json'),
  client = request.createClient(process.env.API_ROOT),
  fmt = require('util').format,
  QUERY_MINS = 5,
  MIN_POSTS_COUNT = 50
;

let endTime = process.env.SEED_TIME || 1467556707000;

setInterval(run, 1000 * 60 * 60);
run();

function run() {
  let startTime = endTime + 1;

  endTime = 1000 * 60 * QUERY_MINS + startTime - 1;

  let jobMonitorParams = {
    lang: 'en',
    featurizer: 'text',
    start_time: startTime,
    end_time: endTime
  };

  //REST API params
  let postsParams = [
    fmt('[where][%s][%s][0]=%s', 'timestamp_ms', 'between', startTime),
    fmt('[where][%s][%s][1]=%s', 'timestamp_ms', 'between', endTime),
    fmt('[where][lang]=%s', 'en'),
    fmt('[where][featurizer]=%s', 'text'),
    fmt('[where][state]=%s', 'new')
  ].join('&');

  console.log('query params: %j', jobMonitorParams);

  client.get('socialmediaposts/count?' + postsParams)
  .then(res => {
    let count = res.body.count;
    console.log('found %s posts', count);
    if (count > MIN_POSTS_COUNT) {
      client.post('jobmonitors', jobMonitorParams)
      .then(res => console.log(res.body))
      .catch(console.error);
    } else {
      console.log('%s posts isn\'t enough. moving on...', count);
      run();
    }
  })
  .catch(console.error);

}
