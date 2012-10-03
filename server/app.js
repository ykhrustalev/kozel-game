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
  utils = require("./utils"),
  db = require("./db").instance();

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
var Game = require('./game').model(db);


var authHandler = require("./authHandler");

authHandler(io, store);

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
    socket.emit("game:" + state, game.forUser(socket.handshake.user));
  });
}

io.sockets.on('connection', function (socket) {

  // connection is marked as required reload, need notify user only once
  // and close
  if (socket.handshake.reset) {
    socket.emit("game:reload");
    socket.disconnect();
    return;
  }

  var user = socket.handshake.user;

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