var config = require("./config")
  , utils = require("./utils")
  , cookie = require("cookie")
  , express = require("express")
  , Session = express.session.Session
// TODO: remove config dependency, make it accept chain of social integration modules
// previously was used from standalone module `connect`
  , connectUtils = require("express/node_modules/connect/lib/utils")
  , vkHandler = require("./vk").authHandler(config.vk.appId, config.vk.appSecret);

var vkRegExp = new RegExp("vk.com", "i");

var socialHandler = function (data, accept, sessionStore) {

  // Deriving express cookie here to define whether user has already
  // established session
  try {
    var signedCookies = cookie.parse(decodeURIComponent(data.headers.cookie));
    console.log(data.cookie);
    data.cookie = connectUtils.parseSignedCookies(signedCookies, config.secret);
    // should be exactly `sessionID` as required by Session module
    data.sessionID = data.cookie['express.sid'];
  } catch (error) {
    console.warn("faile parsing cookies: " + error);
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

      // Client is actually not allowed to get session but in order to
      // allow auto refresh on client we grand new session but mark it with
      // `reload` flag to allow just one message to be send back with
      // notification that connection reqiores reestablish
      data.reset = true;
      data.session = new Session(data, session);
      accept(null, true);
      // the following should be used to fully deny connectio but it would
      // not make any client notification instead of request fail without
      // knowing the actuall reason, also hard to catch in client
      // javascript
      // accept("Error", false);
      return;
    }

    // Resolve user, could be a locally mocked or from social network
    var handler;
    if (vkRegExp.test(data.headers.referer)) {
      handler = vkHandler;
    } else if (config.env === "development") {
      handler = utils.mockUser;
    } else {
      accept("unauthorized", false);
    }

    try {
      // pass request object to the handler in order to derive user
      // information
      handler(data, function (error, authentificated, profile) {
        data.user = profile;
        data.session = new Session(data, session);
        accept(null, authentificated);
      });
    } catch (e) {
      accept("failed handle request", false);
      console.trace("failed handle request, error:" + e);
    }

  });
};

exports.socialHandler = function (sessionStore) {
  return function (data, accept) {
    return socialHandler(data, accept, sessionStore)
  }
};
