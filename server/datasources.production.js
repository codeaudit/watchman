module.exports = {
  db: {
    connector: 'mongodb',
    connectionTimeout: 10000,
    host: process.env.MONGO_PORT || 'mongo',
    port: process.env.MONGO_PORT || 27017,
    database: 'rancor'
  }
};
