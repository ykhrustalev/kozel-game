var config = require("./config")
  , utils = require("./utils")
  , cookie = require("cookie")
  , connect = require("connect")
  , Session = connect.middleware.session.Session
  , vk = require("./vk");
// TODO: check the express.session.MemoryStore
// TODO: remove explicit dependency on the `connect` and `session`

function handleAuth(io, sessionStore){

  var vkRegExp = new RegExp("vk.com", "i");

  io.configure(function () {

    io.set("authorization", function (data, accept) {

      // Deriving express cookie here to define whether user has already
      // established session
      try {
        var signedCookies = cookie.parse(decodeURIComponent(data.headers.cookie));
        data.cookie = connect.utils.parseSignedCookies(signedCookies, config.secret);
        // should be exactly `sessionID` as required by Session module
        data.sessionID = data.cookie['express.sid'];
      } catch (err) {
        accept('Malformed cookie transmitted.', false);
        return;
      }
      // required for session
      data.sessionStore = sessionStore;

      sessionStore.load(data.sessionID, function (error, session) {
        if (error) {
          // error in session storage
          console.warn("error in session storage: ", error);
          accept("Server error", false);
          return;
        }

        if (!session) {
          // Cookie exists but session is missing in storage. Probably it could
          // be due to server reset or cache flush. So need to create a new
          // session but notify the end user.
          console.warn("could not find session for cookie: ", session);

          // Client is actually not allowed to get session but in order to allow
          // auto refresh on client we grand new session but mark it with
          // `reload` flag to allow just one message to be send back with
          // notification that connection reqiores reestablish
          data.reset = true;
          data.session = new Session(data, session);
          accept(null, true);
          // the following should be used to fully deny connectio but it would
          // not make any client notification instead of request fail without
          // knowing the actuall reason, also hard to catch in client javascript
          // accept("Error", false);
          return;
        }

        // Resolve user, could be a locally mocked or from social network
        var handler;
        if (vkRegExp.test(data.headers.referer)) {
          handler = vk.parseUrl;
        } else if (config.env === "development") {
          handler = utils.mockUser;
        } else {
          accept("unauthorized", false);
        }

        var userData = handler(data.headers.referer);

        if (userData.isAuthenticated) {
          // User authorized, session restored
          data.user = userData.profile;
          data.session = new Session(data, session);
          accept(null, true);
        } else {
          accept(null, false);
        }
      });
    });
  });
}

module.exports = handleAuth;
