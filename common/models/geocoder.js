var geocoderProvider = 'openstreetmap';
var httpAdapter = 'https';
// optionnal
var extra = {
    apiKey: 'YOUR_API_KEY', // for Mapquest, OpenCage, Google Premier
    formatter: null         // 'gpx', 'string', ...
};

var geocoder = require('node-geocoder')(geocoderProvider, httpAdapter, extra);

// Using callback

module.exports = function(Geocoder) {

    Geocoder.geoCode = function(req,res, cb) {
        geocoder.geocode(req.query.locationString, function(err, res) {
            if(res.length > 0)
            {
                cb(undefined,res[0]);
            }
        });

    };

    Geocoder.remoteMethod(
        'geoCode',
        {
            accepts: [
                {arg: 'req', type: 'object', 'http': {source: 'req'}},
                {arg: 'res', type: 'object', 'http': {source: 'res'}}
            ],
            returns: {arg: 'data', root:true},
            http: {path: '/geoCode',verb: 'get'}
        }
    );

};
