var express = require("express")
  , routes = require("./routes")
  , http = require("http")
  , path = require("path")
  , app = express()
  , server = http.createServer(app)
  , MemoryStore = express.session.MemoryStore
  , sessionStore = new MemoryStore()
  , io = require("socket.io").listen(server)
  , config = require("./config");


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
  , vk = require("./social/vk")
  , mock = require("./social/mock")
  , socialHandlers = []
  , authHandler
  , gameHandler = require("./handlers/game");

socialHandlers.push(vk.authHandler(config.vk.appId, config.vk.appSecret));
if (config.env === "development") {
  socialHandlers.push(mock.authHandler);
}

authHandler = auth.create(sessionStore, socialHandlers, config.secret);

io.configure(function () {
  io.set("authorization", authHandler.authorize);
});

io.sockets.on('connection', function (socket) {
  authHandler.handleConnect(io, socket, function (socket) {
    gameHandler.handle(io, socket, function (socket) {

    });
  });
});
