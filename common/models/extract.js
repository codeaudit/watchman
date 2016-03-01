var app = require('../../server/server'),
    fs = require('fs'),
    path = require('path'),
    relativeUploadPath = '../../temp/',
    mkdirp = require('mkdirp'),
    Ner = require('node-ner'),
    textract = require('textract');

mkdirp(path.join(__dirname, relativeUploadPath), function (err) {
    if (err) {
        console.error(err);
    }
});

module.exports = function(Extract) {
    var extractorName = "stanford-ner";

    Extract.extractionMap = {};

    Extract.createOrUpdateExtraction = function(name,value,dwTrailUrlId,requester){
      if(Extract.extractionMap[value]){
          Extract.extractionMap[value].occurrences++;
        return;
      }
      Extract.extractionMap[value] = {
          "value": value,
          "occurrences":1,
          "dwTrailUrlId": dwTrailUrlId,
          "extractorTypes":[name],
          "extractor": extractorName,
          "requester": requester
      };
    };

    Extract.processPost = function(req,res, cb) {
        console.log("StanNER Extractor POST received");
        try {
            textract.fromBufferWithMime('text/html', new Buffer(req.body.dataString), function (err, data) {
                var filePath = path.join(__dirname, relativeUploadPath + "/temp");
                console.log("Entering DW StanNER Extractor for trail: " + req.body.dwTrailUrlId +",requester:" + req.body.requester);

                fs.writeFile(filePath, data, function(err) {
                    if(err) {
                        return console.log(err);
                    }
                    var ner = new Ner({
                        install_path:	path.join(__dirname, '../../stanford-ner-2014-10-26')
                    });

                    ner.fromFile(filePath, function(entities) {
                        console.log(entities);
                        res.status(200).send(entities);

                        fs.unlink(filePath, function(err) {
                            if (err) {
                                return console.error(err);
                            }
                            console.log("File deleted successfully!");
                        });
                    });
                    console.log("The file was saved!");
                });
            });
        }
        catch (getError) {
          console.log("Error during stanNER extraction");
          console.log(getError);
          res.status(500).send(getError.message);
        }
  };

  Extract.remoteMethod(
    'processPost',
    {
      accepts: [
        {arg: 'req', type: 'object', 'http': {source: 'req'}},
        {arg: 'res', type: 'object', 'http': {source: 'res'}}
      ],
      returns: {arg: 'data', root:true},
      http: {path: '/process',verb: 'post'}
    }
  );

};
