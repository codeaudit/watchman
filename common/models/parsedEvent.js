
module.exports = function(ParsedEvent) {

    ParsedEvent.destroyData = function(req,res, cb) {

        ParsedEvent.destroyAll();

        cb(null,'All data destroyed.');
    };

    ParsedEvent.remoteMethod(
        'destroyData',
        {
            accepts: [
                {arg: 'req', type: 'object', 'http': {source: 'req'}},
                {arg: 'res', type: 'object', 'http': {source: 'res'}}
            ],
            returns: {arg: 'data', root:true},
            http: {path: '/destroy',verb: 'get'}
        }
    );

};
