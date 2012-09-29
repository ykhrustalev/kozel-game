/**
 * Module dependencies.
 */

var express = require("express"),
  routes = require("./routes"),
  http = require("http"),
  path = require("path"),
  app = express(),
  server = http.createServer(app),
  io = require("socket.io").listen(server),
  config = require("./config"),
  utils = require("./utils");

var trace = utils.trace;

var cookie = require("cookie")
  , connect = require("connect")
  , Session = connect.middleware.session.Session
  , MemoryStore = connect.middleware.session.MemoryStore;
//TODO check the express.session.MemoryStore
// TODO: remove explicit dependency on the `connect` and `session`

var store = new MemoryStore();

app.configure(function () {
//  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'html');
  app.engine('html', require('consolidate').hogan);
  app.set("env", config.env);
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser(config.secret));
  app.use(express.session({
    secret: config.secret,
    key   : 'express.sid',
    store : store
  }));
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function () {
  app.use(express.errorHandler());
});

app.get('/', routes.index);

// templates
require('./templates').api(app);

http.createServer(app).listen(app.get('port'), function () {
  console.log("Express server listening on port " + app.get('port'));
});

server.listen(config.port);

// game
var mongoose = require("mongoose"),
  g = require('./game');

var db = mongoose.createConnection(config.db.host, config.db.name),
  Game = g.model(db);

db.on('error', console.error.bind(console, 'connection error:'));

var vk = require("./vk");

io.configure(function () {

  // vk authentication on demand
  io.set("authorization", function (data, accept) {

    trace("authorization");
    try {
      var _signed_cookies = cookie.parse(decodeURIComponent(data.headers.cookie));
      data.cookie = connect.utils.parseSignedCookies(_signed_cookies, config.secret);
      data.sessionID = data.cookie['express.sid']; // should be exactly `sessionID` as required by Session module
      trace("session cookie: ", data.cookie, _signed_cookies);
    } catch (err) {
      accept('Malformed cookie transmitted.', false);
      return;
    }
    data.sessionStore = store;

    store.load(data.sessionID, function (error, session) {
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
        // TODO: check if it should fail or not
        // TODO: make it create a new session
        accept("Error", false);
        return;
      }

      // Session restored
      trace("session valid");
      data.session = new Session(data, session);

      var userData = (config.isLocal ? utils.mockUser : vk.parseUrl)(data.headers.referer);

      if (userData.isAuthenticated) {
        data.profile = userData.profile;
        accept(null, true);
      } else {
        accept(null, false);
      }
    });
  });
});

io.sockets.on('connection', function (socket) {

  var user = socket.handshake.profile;

  socket.join("available");

  /**
   * client API:
   *
   * -> game:list:available ()
   * <- game:listed:available (games) [user]
   *
   * -> game:create ()
   * <- game:created (game) [all:available]
   * <- game:createfailed (error) [user]
   *
   * -> game:join (id)
   * <- game:joined (game) [players]
   * <- game:joinfailed (error) [user]
   * <- game:started (game) [palyers]
   *
   * -> game:current ()
   * -> game:turn (card)
   * <- game:turnfailed [user]
   * <- game:current (game) [players]
   * <- game:roundend (game) [players]
   * <- game:gameend (game) [players]
   *
   */

  socket.on("game:list:available:", function () {
    Game.listAvailable(function (games) {
      socket.emit.emit("game:list:available", games);
    });
  });

  socket.on("game:create", function () {
    Game.create(
      user,
      function (game) {
        socket.leave("available");
        socket.join("game:" + game._id);
        socket.emit("game:created", game.forUser(user));
      },
      function (error) {
        socket.emit("game:createfailed", error);
      }
    );
  });

  socket.on("game:join", function (data) {
    Game.join(data.id, user, socket.id,
      function (game) {
        //TODO: emit players
        socket.leave("available");
        socket.join("game:" + game._id);
        // TODO: emit message directly to with .forUser(user)
        io.sockets["game:" + game._id].emit("game:started", game);
        //TODO emit all not in game with new availalble list
      },
      function (error) {
        //TODO: emit players
        socket.emit("game:createfailed", error);
      });
  });

  socket.on("game:current", function () {
    Game.currentForUser(user, function (game) {
      if (game) {
        socket.emit("game:current", game);
      } else {
        Game.listAvailable(function (games) {
          socket.emit("game:list:available", games);
        });
      }
    });
  });

  socket.on("game:turn", function (data) {
    Game.turn(data.id,
      function (game, flag) {

        //TODO: define flags, define states
      },
      function (error) {
        socket.emit("game:turnfailed", error);
      }
    );
  });

  socket.on('disconnect', function () {
    console.log('user disconnected: ', arguments);
    // TODO: notify game
    io.sockets.emit('user disconnected', user);
  });

  socket.on("session", function () {
    socket.emit("session", {id: socket.id, handshake: socket.handshake});
  });

});