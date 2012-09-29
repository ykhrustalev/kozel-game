var url = require("url"),
  _ = require("underscore")._;

module.exports = {
  trace: function (message) {
    console.warn("TRACE: " + message);
  },

  mockUser: function (queryString) {
    var queryParams = url.parse(queryString, true).query;
    var uid = parseInt(queryParams.uid) || _.uniqueId();
    return {
      isAuthenticated: true,
      profile        : {
        uid       : uid,
        first_name: "first_name " + uid,
        last_name : "last_name " + uid
      }
    };
  }

};