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

function notifyAvailable() {
  Game.listAvailable(function (games) {
    io.sockets.in("available").emit("game:list:available", games);
  });
}

function joinGame(socket, game) {
  var room = "game:" + game._id;
  socket.leave("available");
  socket.join(room);
}

function notifyGameRoom(game, state) {
  var room = "game:" + game._id;
  state = state || "current";
  io.sockets.clients(room).forEach(function (socket) {
    socket.emit("game:" + state, game.forUser(socket.handshake.profile));
  });
}

io.sockets.on('connection', function (socket) {

  // TODO: rename handshake.profile -> handshake.user
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
    // TODO: check that user is in game?
    Game.listAvailable(function (games) {
      socket.emit("game:list:available", games);
    });
  });

  socket.on("game:create", function () {
    Game.create(
      user,
      function (game) {
        joinGame(socket, game);
        socket.emit("game:created", game.forUser(user));
        notifyAvailable();
      },
      function (error) {
        socket.emit("game:createfailed", error);
      }
    );
  });

  socket.on("game:join", function (data) {
    Game.join(data.id, user, socket.id,
      function (game, started) {
        joinGame(socket, game);
        notifyGameRoom(game, "current");
        notifyAvailable();
      },
      function (error) {
        //TODO: emit players
        console.warn(error);
        socket.emit("game:joinfailed", error);
      });
  });

  socket.on("game:current", function () {
    Game.currentForUser(user, function (game) {
      if (game) {
        joinGame(socket, game);
        socket.emit("game:current", game.forUser(user));
      } else {
        Game.listAvailable(function (games) {
          socket.emit("game:list:available", games);
        });
      }
    });
  });

  socket.on("game:turn", function (data) {
    Game.turn(user, data.cardId,
      function (game, state) {
        notifyGameRoom(game, state);
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

//  socket.on("session", function () {
//    socket.emit("session", {id: socket.id, handshake: socket.handshake});
//  });

});