var geocoderProvider = 'openstreetmap',
    app = require('../../server/server'),
    httpAdapter = 'https';

// optionnal
var extra = {
    apiKey: 'YOUR_API_KEY', // for Mapquest, OpenCage, Google Premier
    formatter: null         // 'gpx', 'string', ...
};

var geocoder = require('node-geocoder')(geocoderProvider, httpAdapter, extra);

// Using callback

module.exports = function(Geocoder) {

    Geocoder.geoCode = function(req,res, cb) {

        cb(null,'geocoding object');

        var whereClause={
            where: {
                id: req.query.id
            }
        };
        var parsedEvent = app.models.ParsedEvent;
        parsedEvent.findOne(whereClause).then(function(item, err){
            if(err || !item){
                console.log("no item found to geo code.");
                return;
            }

            if(!item.locations || item.locations.length === 0){
                console.log("no locations to geo code.");
                return;
            }

            geocoder.geocode(item.locations[0], function(err, res) {
                if(res.length === 0){
                    return;
                }

                item.lat = res[0].latitude;
                item.lng = res[0].longitude;
                item.geoCoded = true;

                item.save();
            });
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
