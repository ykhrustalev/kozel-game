var db = require("../db").instance()
  , Game = require('../game').model(db)
  , _ = require("underscore")._;

function IoHolder(io) {
  this.io = io;
  this.byUid = {};
}

IoHolder.prototype = {

  registerSocket: function (socket) {
    var store = this.byUid
      , uid = socket.handshake.user.uid;
    if (!store[uid]) {
      store[uid] = [];
    }
    store[uid].push(socket);
  },

  unregisterSocket: function (socket) {
    console.log("called unregister");
    var store = this.byUid
      , uid = socket.handshake.user.uid;
    if (store[uid]) {
      console.log("store before remove: " + store.length);
      store[uid] = _.without(store[uid], socket);
      console.log("store after remove: " + store.length);
    }
  },

  getRoom: function (game) {
    return "game:" + game.id;
  },

  emitAvailableGames: function (socket) {
    var io = this.io;
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
    var io = this.io
      , room = this.getRoom(game)
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
    var io = this.io
      , room = this.getRoom(game)
      , uid = socket.handshake.user.uid;
    io.sockets.clients(room).forEach(function (socket) {
      if (socket.handshake.user.uid === uid) {
        socket.leave(room);
        socket.join("available");
      }
    });
  },

  broadcastRoom: function (game, state, socket) {
    var io = this.io
      , room = this.getRoom(game);
    (socket ? [socket] : io.sockets.clients(room)).forEach(function (socket) {
      socket.emit("game", {
        status: state,
        object: game.forUser(socket.handshake.user)
      });
    });
  }
};


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

function handle(ioHolder, socket, user) {

  ioHolder.registerSocket(socket);

  socket.join("available");

  socket.on("games:list", function (data) {
    if (data.filter === "available") {
      ioHolder.emitAvailableGames(socket);
    }
  });

  socket.on("games:create", function () {
    Game.create(user, function (error, game) {

      if (error) {
        socket.emit("game:createfailed", error);
        return;
      }

      ioHolder.joinRoom(socket, game);
      ioHolder.broadcastRoom(game, "created");
      ioHolder.emitAvailableGames();
    });
  });

  socket.on("games:join", function (data) {
    Game.join(data.gid, user, function (error, game, started) {

      if (error) {
        socket.emit("game:joinfailed", error);
        return;
      }

      ioHolder.joinRoom(socket, game);
      ioHolder.broadcastRoom(game, started ? "started" : "userjoined");
      ioHolder.emitAvailableGames();
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
        ioHolder.joinRoom(socket, game);
        ioHolder.broadcastRoom(game, "current", socket);
      } else {
        ioHolder.emitAvailableGames(socket);
      }
    });
  });

  socket.on("game:turn", function (data) {
    Game.turn(user, data.cid, function (error, game, state) {
      if (error) {
        socket.emit("game:turnfailed", error);
        return;
      }
      ioHolder.broadcastRoom(game, state);
    });
  });

  socket.on("game:leave", function () {
    Game.leave(user, function (error, game) {
      if (error) {
        socket.emit("game:leavefail", error);
        return;
      }

      ioHolder.leaveRoom(socket, game);
      ioHolder.broadcastRoom(game, "userleft");
      ioHolder.emitAvailableGames();
    });
  });

  socket.on('disconnect', function () {
    ioHolder.unregisterSocket(socket);
    // TODO: notify game
  });
}
exports.handle = function (io, socket, chain) {
  handle(new IoHolder(io), socket, socket.handshake.user);
  chain(socket);
};
