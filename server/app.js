/**
 * Module dependencies.
 */

var express = require("express")
    , routes = require("./routes")
    , http = require("http")
    , path = require("path")
    , app = express()
    , server = http.createServer(app)
    , io = require("socket.io").listen(server)
    , config = require("./config")
    , _ = require("underscore")._;


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
    gameSchema = require('./game');

db = mongoose.createConnection(config.db.host, config.db.name);

var Game = db.model('Game', gameSchema);

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
          uid       : _.identity(),
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

  var profile = socket.handshake.profile;

  socket.on("game:create", function () {
    Game.create(profile, function (data) {
      socket.emit("game:created", data);
    });
  });

  socket.on("game:join", function (data) {
    Game.join(data.id, profile,
        function () {

        },
        function (game) {
          io.sockets.emit("game:started", game);
        });
  });

  socket.on("games:available", emitAvailableGames);

  socket.on("game:current", function () {
    Game.findByUser(profile, function (error, data) {
      if (data && data[0]) {
        socket.emit("game:current", data[0].exportForPlayer(profile.uid));
      } else {
        socket.emit("game:current", null);
      }
    });
  });

  socket.on('disconnect', function () {
    console.log('user disconnected: ', arguments);
    io.sockets.emit('user disconnected', profile);
  });

});