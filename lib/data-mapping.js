// def: util for ES type mapping
'use strict';

module.exports = {
  createIndexWithMapping(options) {
    const client = options.client,
      index = options.index,
      type = options.type,
      mapping = options.mapping;

    return client.indices.exists({index})
    .then(exists => {
      return (exists ? exists : client.indices.create({index}));
    })
    // .then(() => {
    //   return client.indices.putMapping({
    //     index,
    //     type,
    //     body: mapping
    //   });
    // });
  }
};
