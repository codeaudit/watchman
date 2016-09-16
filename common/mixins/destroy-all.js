module.exports = function(Model, options) {

  Model.destroyData = function(cb) {
    Model.destroyAll()
      .then(() => cb(null, { data: 'All data destroyed' }))
      .catch(cb);
  };

  // 'destroy all' endpoint for dev convenience.
  // TODO: use POST method instead
  Model.remoteMethod(
    'destroyData',
    {
      description: 'Destroy all records.',
      returns: { arg: 'data', root: true },
      http: { path: '/destroy', verb: 'get' }
    }
  );

};
