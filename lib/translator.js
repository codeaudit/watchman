// def: wrapper for translators
'use strict';

require('dotenv').config({silent: true});

const Translator = require('mstranslator');
const client = new Translator({
  client_id: process.env.TRANSLATE_CLIENT_ID,
  client_secret: process.env.TRANSLATE_CLIENT_SECRET
}, true); // true: auto-generate token


module.exports = {
  translateToEnglish: translateToEnglish,
  translate: client.translate.bind(client),
  detect: client.detect.bind(client)
};

// convenience method for likely common query
function translateToEnglish(text, cb) {
  client.translate({text: text, to: 'en'}, cb);
}
