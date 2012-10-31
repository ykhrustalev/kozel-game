var url = require("url")
  , _ = require("underscore")._;

exports.authHandler = {

  canHandle: function (request) {
    return true;
  },

  handle: function (request, callback) {
    var queryParams = url.parse(request.headers.referer, true).query
      , uid = parseInt(queryParams.uid) || _.uniqueId();
    callback(null, true, {
      uid       : "mock" + uid,
      first_name: "User" + uid,
      last_name : "Surname",
      avatar    : "/images/default-avatar.png"
    });
  }
};