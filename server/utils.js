var url = require("url")
  , _ = require("underscore")._;

module.exports = {
  trace: function (message) {
    console.warn("TRACE: " + message);
  },

  mockUser: function (request, callback) {
    var queryParams = url.parse(request.headers.referer, true).query
      , uid = parseInt(queryParams.uid) || _.uniqueId();
    callback(null, true, {
      uid       : uid,
      first_name: "user " + uid,
      last_name : ""
    });
  }

};