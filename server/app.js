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
  , social = require("./social")
  , socialHandlers = []
  , authHandler;

socialHandlers.push(social.vk.authHandler(config.vk.appId, config.vk.appSecret));
if (config.env === "development") {
  socialHandlers.push(social.mock.authHandler);
}

authHandler = auth.create(sessionStore, socialHandlers, config.secret);

io.configure(function () {
  io.set("authorization", authHandler.authorize);
});

// game
var Game = require('./game').model(db);


var socketsKeeper = {
  byUid: {}
};
var _ = require("underscore")._;
var SocketHelpers = {

  registerSocket: function  (socket) {
    var store = socketsKeeper.byUid
      , uid = socket.handshake.user.uid;
    if (!store[uid]) {
      store[uid]= [];
    }
    store[uid].push(socket);
  },

  unregisterSocket: function  (socket) {
    console.log("called unregister");
    var store = socketsKeeper.byUid
      , uid = socket.handshake.user.uid;
    if (store[uid]) {
      console.log("store before remove: "+store.length);
      store[uid]= _.without(store[uid], socket);
      console.log("store after remove: "+store.length);
    }
  },

  getRoom: function (game) {
    return "game:" + game.id;
  },

  emitAvailableGames: function (socket) {
    Game.listAvailable(function (error, games) {

      if (error) {
        console.warn("error: ", error);
        if (socket) {
          socket.emit("error", "internal error");
        } else {
          io.sockets.emit("error", "internal error");
        }
        return;
      }

      (socket ? socket : io.sockets.in("available")).emit("games:list", {
        filter : "available",
        objects: games
      });
    });
  },

  joinRoom: function (socket, game) {
    var room = this.getRoom(game)
      , uid = socket.handshake.user.uid;
    // TODO: is it too expensive to lookup for all sockets from user?\
    io.sockets.clients("available").forEach(function (socket) {
      if (socket.handshake.user.uid === uid) {
        socket.leave("available");
        socket.join(room);
      }
    });
  },


  leaveRoom: function (socket, game) {
    var room = this.getRoom(game)
      , uid = socket.handshake.user.uid;
    io.sockets.clients(room).forEach(function (socket) {
      if (socket.handshake.user.uid === uid) {
        socket.leave(room);
        socket.join("available");
      }
    });
  },

  broadcastRoom: function (game, state, socket) {
    var room = this.getRoom(game);
    (socket ? [socket] : io.sockets.clients(room)).forEach(function (socket) {
      socket.emit("game", {
        status: state,
        object: game.forUser(socket.handshake.user)
      });
    });
  }
};

io.sockets.on('connection', function (socket) {

  authHandler.connect(socket, function  (socket) {

  });

  SocketHelpers.registerSocket(socket);

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

  socket.on("games:list", function (data) {
    if (data.filter === "available") {
      SocketHelpers.emitAvailableGames(socket);
    }
  });

  socket.on("games:create", function () {
    Game.create(user, function (error, game) {

      if (error) {
        socket.emit("game:createfailed", error);
        return;
      }

      SocketHelpers.joinRoom(socket, game);
      SocketHelpers.broadcastRoom(game, "created");
      SocketHelpers.emitAvailableGames();
    });
  });

  socket.on("games:join", function (data) {
    Game.join(data.gid, user, function (error, game, started) {

      if (error) {
        socket.emit("game:joinfailed", error);
        return;
      }

      SocketHelpers.joinRoom(socket, game);
      SocketHelpers.broadcastRoom(game, started ? "started" : "userjoined");
      SocketHelpers.emitAvailableGames();
    });
  });

  socket.on("app:current", function () {
    Game.currentForUser(user, function (error, game) {

      if (error) {
        console.warn("error: ", error);
        socket.emit("error", "internal error");
        return;
      }

      if (game) {
        SocketHelpers.joinRoom(socket, game);
        SocketHelpers.broadcastRoom(game, "current", socket);
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
      SocketHelpers.broadcastRoom(game, state);
    });
  });

  socket.on("game:leave", function () {
    Game.leave(user, function (error, game) {
      if (error) {
        socket.emit("game:leavefail", error);
        return;
      }

      SocketHelpers.leaveRoom(socket, game);
      SocketHelpers.broadcastRoom(game, "userleft");
      SocketHelpers.emitAvailableGames();
    });
  });

  socket.on('disconnect', function () {
    SocketHelpers.unregisterSocket(socket);
    // TODO: notify game
//    io.sockets.emit('user disconnected', user);
  });


});