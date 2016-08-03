'use strict';

// def: misc. Promise-related tools

module.exports = {

  delay(interval) {
    return new Promise((res, rej) => {
      setTimeout(res, interval * 1000);
    });
  }

};
