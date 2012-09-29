var url = require("url"),
  _ = require("underscore")._;

module.exports = {
  trace: function (message) {
    console.warn("TRACE: " + message);
  },

  mockUser: function (queryString) {
    var queryParams = url.parse(queryString, true).query;
    return {
      isAuthenticated: true,
      profile        : {
        uid       : queryParams.uid || _.uniqueId(),
        first_name: "first_name " + _.uniqueId(),
        last_name : "last_name " + _.uniqueId()
      }
    };
  }

};