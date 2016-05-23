// def: wrapper for translators
'use strict';

require('dotenv').config({silent: true});

const translate = require('yandex-translate')(process.env.YANDEX_API_KEY);

module.exports = {
  translateToEnglish: translateToEnglish,
  translate: translate.translate,
  detect: translate.detect
};

// convenience method for likely common query
function translateToEnglish(text, cb) {
  translate.translate(text, {to: 'en'}, cb);
}


// translate.translate('You can burn my house, steal my car, drink my liquor from an old fruitjar.', { to: 'ru' }, function(err, res) {
//   console.log(res);
// });

// translate.detect('Граждане Российской Федерации имеют право собираться мирно без оружия, проводить собрания, митинги и демонстрации, шествия и пикетирование', function(err, res) {
//    console.log(res);
// });
