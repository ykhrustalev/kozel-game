var cookie = require("cookie")
  , express = require("express")
  , Session = express.session.Session
// previously was used from standalone module `connect`
  , connectUtils = require("express/node_modules/connect/lib/utils");

function socialHandler(data, accept, sessionStore, handlers, secret) {

  try {
    // Deriving express cookie here to define whether user has already
    // established session
    var signedCookies = cookie.parse(decodeURIComponent(data.headers.cookie));

    // Creating structure for the Session module that looks like request
    data.cookie = connectUtils.parseSignedCookies(signedCookies, secret);
    data.sessionID = data.cookie['express.sid'];
    data.sessionStore = sessionStore;

  } catch (error) {
    console.warn("failed parsing cookies: " + error);
    accept('Malformed cookie transmitted', false);
    return;
  }

  //
  sessionStore.load(data.sessionID, function (error, session) {
    if (error) {
      console.warn("error in session storage: ", error);
      accept("Server error", false);
      return;
    }

    if (!session) {
      // Cookie exists but session is missing in storage. Probably it could
      // be due to server reset or cache flush. So need to create a new
      // session but notify the end user.
      // Client is actually not allowed to get session but in order to
      // allow auto refresh on client we grand new session but mark it with
      // `reload` flag to allow just one message to be send back with
      // notification that connection should be reestablish
      console.warn("could not find session for cookie: ", data.sessionID);
      data.reset = true;
      data.session = new Session(data, session);
      accept(null, true);
      // the following should be used to fully deny connection
      // accept("Error", false);
      return;
    }

    // Resolve user, could be a locally mocked or from social network
    var handler;
    for (var i = 0, len = handlers.length; i < len; ++i) {
      if (handlers[i].canHandle(data)) {
        handler = handlers[i];
        break;
      }
    }

    if (!handler) {
      accept("unauthorized", false);
      return;
    }

    try {
      // pass request object to the handler in order to derive user
      // information
      handler.handle(data, function (error, profile) {
        if (error) {
          accept(error, false);
          return;
        }
        // TODO: validate profile
        //           if (!profile.uid || !profile.first_name || !profile.last_name || !profile.avatar)
        data.user = profile;
        data.session = new Session(data, session);
        accept(null, true);
      });
    } catch (e) {
      accept("failed handle request", false);
      console.warn("failed handle request, error:", e, " handler:", handler);
    }

  });
}

// TODO: comments
function handleConnect(io, socket, chain) {
  // connection is marked as required reload, need notify user only once
  // and close
  if (socket.handshake.reset) {
    socket.emit("app:reload");
    socket.disconnect();
  } else {
    chain(socket);
  }
}

/**
 * Authorization handler, uses request to derive user information.
 * Uses standalone modules to contact social networks.
 * Handler should implement functions:
 * - canHandle(request)
 * - handle(request, callback)
 *
 * callback should take parameters:
 * - {Mixed} error
 * - {boolean} isAuthenticated
 * - {Object} profile - {uid, first_name, last_name}
 *
 * @param sessionStore
 * @param handlers
 * @param secret
 * @return {Object} wrapper for handlers
 */

exports.create = function (sessionStore, handlers, secret) {
  return {
    authorize: function (data, accept) {
      return socialHandler(data, accept, sessionStore, handlers, secret);
    },

    handleConnect: handleConnect
  };
};
