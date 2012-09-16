/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path')
  , app = express()
  , server = http.createServer(app)
  , io = require('socket.io').listen(server);


app.configure(function () {
//  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'html');
  app.engine('html', require('consolidate').hogan);
//  app.set('env', 'production');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('sdkjhlwbgibevb23rvke'));
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

server.listen(3000);

// game
var Game = require('./game');
//

function emitAvailableGames (){
  Game.findAvailableForJoin(function (err, objects) {
    io.sockets.emit("games:available", objects)
  });
}

io.sockets.on('connection', function (socket) {

  socket.emit('news', { hello: 'world' });

  socket.on('game:new', function (data) {
    console.log('game:new', socket);
    var game = new Game;
    game.save();

    emitAvailableGames();
  });

  socket.on('game:join', function (data) {
    console.log('game:join', socket);
    Game.find('_id', data.gameId).select('_id playersCount players created score')
      .exec(function(results){
        console.log(results);
      });
  });

  socket.on("games:available", emitAvailableGames);

  socket.on('disconnect', function () {
    console.log('user disconnected: ', arguments);
    io.sockets.emit('user disconnected');
  });

});