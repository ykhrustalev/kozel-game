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
  _ = require("underscore")._;


app.configure(function () {
//  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'html');
  app.engine('html', require('consolidate').hogan);
  app.set("env", config.env);
  app.use(express.favicon());
  app.use(express.logger("dev"));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser(config.secret));
  app.use(express.session());
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


io.configure(function () {

  // vk authentication on demand
  io.set('authorization', function (handshakeData, callback) {

    var data;
    if (!config.isLocal) {

      var vk = require("./vk");
      var referer = handshakeData.headers.referer;
      data = vk.parseUrl(referer);

    } else {
      data = {
        isAuthenticated: true,
        profile        : {
          uid       : _.uniqueId(),
          first_name: "first_name",
          last_name : "last_name"
        }
      };
    }

    if (data.isAuthenticated) {
      handshakeData.profile = data.profile;
      callback(null, true);
    } else {
      callback(null, false);
    }
  });
});

function emitAvailableGames() {
  Game.findAvailableForJoin(function (err, games) {
    io.sockets.emit("games:available", games)
  });
}

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
        socket.emit("game:created", game);
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
        io.sockets["game:" + game._id].emit("game:started", game);
        //TODO emit all not in game with new availalble list
      },
      function (error) {
        //TODO: emit players
        socket.emit("game:createfailed", error);
      });
  });

  socket.on("game:current", function () {

    Game.findByUser(user, function (error, games) {
      if (games && games.length) {
        socket.emit("game:current", games[0]);
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

});