module.exports.authHandler = {

  canHandle: function (request) {
    return typeof request.query.uid !== "undefined";
  },

  handle: function (request, callback) {
    var uid = request.query.uid;
    callback(null, {
      uid       : "mock" + uid,
      first_name: "User" + uid,
      last_name : "Surname",
      avatar    : "/images/default-avatar.png"
    });
  }
};