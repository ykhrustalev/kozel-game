var config = require("./config")
  , mongoose = require("mongoose")
  , db = mongoose.createConnection(config.db.host, config.db.name);

db.on('error', console.error.bind(console, 'connection error:'));

exports.instance = function () {
  return db;
};
