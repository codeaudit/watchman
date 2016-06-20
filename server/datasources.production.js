module.exports = {
  db: {
    connector: 'mongodb',
    connectionTimeout: 10000,
    host: process.env.MONGO_PORT_27017_TCP_ADDR,
    port: process.env.MONGO_PORT_27017_TCP_PORT,
    database: 'rancor'
  }
};
