var express = require("express")
  , routes = require("./routes")
  , http = require("http")
  , path = require("path")
  , app = express()
  , server = http.createServer(app)
  , MemoryStore = express.session.MemoryStore
  , sessionStore = new MemoryStore()
  , io = require("socket.io").listen(server)
  , config = require("./config")
  , db = require("./db").instance();


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
    store : sessionStore
  }));
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function () {
  app.use(express.errorHandler());
});

app.get('/', routes.index);
app.get('/health', routes.health);

// templates
require('./templates').api(app);

http.createServer(app);

server.listen(config.port);

// authentication
var auth = require("./auth")
  , social = require("./social");

io.configure(function () {
  var handlers = [
    social.vk.authHandler(config.vk.appId, config.vk.appSecret)
  ];
  if (config.env === "development") {
    handlers.push(social.mock.authHandler);
  }
  io.set("authorization", auth.enable(sessionStore, handlers));
});

// game
var Game = require('./game').model(db);

var SocketHelpers = {
  emitAvailableGames: function (socket) {
    Game.listAvailable(function (error, games) {

      if (error) {
        console.warn("error: ", error);
        if (socket) {
          socket.emit("game:error", "internal error");
        } else {
//          io.sockets
        }
        return;
      }

      if (socket) {
        socket.emit("game:list:available", games);
      } else {
        io.sockets.in("available").emit("game:list:available", games);
      }
    });
  },

  joinUserToGame: function (socket, game) {
    var room = "game:" + game._id;
    socket.leave("available");
    socket.join(room);
  },


  leaveGame: function (socket, game) {
    var room = "game:" + game._id;
    socket.leave(room);
    socket.join("available");
  },

  emitGameRoom: function (game, state) {
    var room = "game:" + game._id;
    state = state || "current";
    io.sockets.clients(room).forEach(function (socket) {
      socket.emit(state, game.forUser(socket.handshake.user));
    });
  }
};


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
    SocketHelpers.emitAvailableGames(socket);
  });

  socket.on("game:create", function () {
    Game.create(user, function (error, game) {

      if (error) {
        socket.emit("game:createfailed", error);
        return;
      }

      SocketHelpers.joinUserToGame(socket, game);
      SocketHelpers.emitGameRoom(game, "game:created");
      SocketHelpers.emitAvailableGames();
    });
  });

  socket.on("game:join", function (data) {
    Game.join(data.gid, user, function (error, game, state) {

      if (error) {
        socket.emit("game:joinfailed", error);
        return;
      }

      SocketHelpers.joinUserToGame(socket, game);
      SocketHelpers.emitGameRoom(game, "game:" + state);
      SocketHelpers.emitAvailableGames();
    });
  });

  socket.on("game:current", function () {
    Game.currentForUser(user, function (error, game) {

      if (error) {
        console.warn("error: ", error);
        socket.emit("game:error", "internal error");
        return;
      }

      if (game) {
        SocketHelpers.joinUserToGame(socket, game);
        socket.emit("game:current", game.forUser(user));
      } else {
        SocketHelpers.emitAvailableGames(socket);
      }
    });
  });

  socket.on("game:turn", function (data) {
    Game.turn(user, data.cid, function (error, game, state) {
      if (error) {
        socket.emit("game:turnfailed", error);
        return;
      }
      SocketHelpers.emitGameRoom(game, "game:" + state);
    });
  });

  socket.on("game:leave", function () {
    Game.leave(user, function (error, game) {
      if (error) {
        socket.emit("game:leavefail", error);
        return;
      }

      SocketHelpers.leaveGame(socket, game);
      SocketHelpers.emitGameRoom(game, "game:left");
      SocketHelpers.emitAvailableGames(socket);
      SocketHelpers.emitAvailableGames();
    })
  });

  socket.on('disconnect', function () {
    console.log('user disconnected: ', arguments);
    // TODO: notify game
//    io.sockets.emit('user disconnected', user);
  });


});