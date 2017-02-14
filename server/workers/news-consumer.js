// def: find stored feed data and send to ner
'use strict';

const request = require('request'),
    app = require('../../server/server'),
    _ = require('lodash'),
    WAIT = 30; //seconds;

const { Qcrnews }=app.models;

const worker = module.exports = {
    start() {
        run();
        // recursively run, with a wait period
        function run() {
            var lineReader = require('readline').createInterface({
                input: require('fs').createReadStream('newsEvents20170210.jl')
            });

            lineReader.on('line', function (line) {
                let str = line.replaceAll('}/n{','}\n{');
                let newsRa = str.split('\n');
                newsRa.forEach(function (a){
                    let news = JSON.parse(a);
                    Qcrnews.create(news);
                });

            });
        }
    }
};

String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};

// start if run as a worker process
if (require.main === module)
    worker.start();