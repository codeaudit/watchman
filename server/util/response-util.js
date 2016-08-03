// def: http response helpers
'use strict';

module.exports = {

  // options:
  //   message, code
  fail401(cb, options) {
    const err = new Error(options.message || '401 error');
    err.status = 401;
    err.statusCode = 401;
    err.code = options.code || 'LOGIN_FAILED';
    return cb(err);
  },

  fail4xx(cb, options) {
    const err = new Error(options.message || '4xx error');
    err.status = options.statusCode;
    err.statusCode = options.statusCode;
    // err.code = options.code; // what is err.code?
    return cb(err);
  },

  // success but processed differently
  // "thanks for the data, we're not saving it.""
  return202(cb) {
    const res = {
      message: 'Accepted',
      status: 202,
      statusCode: 202
    };
    return cb(res);
  }
};
