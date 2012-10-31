var express = require("express")
  , routes = require("./routes")
  , http = require("http")
  , path = require("path")
  , fs = require("fs")
  , app = express()
  , server = http.createServer(app)
  , MemoryStore = express.session.MemoryStore
  , sessionStore = new MemoryStore()
  , io = require("socket.io").listen(server)
  , config = require("./config")
  , isDev = config.env === "development";


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
  app.use(express.static(path.join(__dirname, '../public')));
});

app.configure('development', function () {
  app.use(express.errorHandler());
});

// server views
app.get('/', routes.index);
app.get('/health', require("./routes/health"));

// templates
var scanDir = __dirname + "/views/shared/"
  , wrapperFile = __dirname + "/views/wrapper.html"
  , templates = require('./templates').init(scanDir);

if (isDev) {
  app.get("/javascripts/templates.js", function (req, res, next) {
    res.contentType("application/javascript");
    res.send(templates.getContents(wrapperFile));
  });
} else {
  var compiledFile = __dirname + "/../public/javascripts/templates.js";
  fs.writeFileSync(compiledFile, templates.getContents(wrapperFile), "utf8");
}

//http.createServer(app);
server.listen(config.port);

// authentication
var authChain = []
  , vk = require("./social/vk")
  , mock = require("./social/mock");

authChain.push(vk(config.vk.appId, config.vk.appSecret));
if (isDev) {
  authChain.push(mock.authHandler);
}

// io bindings
var authHandler = require("./handlers/auth").create(sessionStore, authChain, config.secret)
  , gameHandler = require("./handlers/game").create();

io.configure(function () {
  io.set("authorization", authHandler.authorize);
});

io.sockets.on('connection', function (socket) {
  authHandler.handleConnect(io, socket, function (socket) {
    gameHandler(io, socket, function (socket) {

    });
  });
});

module.exports = function () {

}
