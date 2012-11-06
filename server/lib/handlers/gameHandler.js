module.exports = function (gameService, io) {

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

  function joinUser(socket, user) {
    socket.join("user:" + user.uid);
  }

  function inUser(user) {
    return io.sockets.clients("user:" + user.uid);
  }


  function inIdle() {
    return io.sockets.clients("idle");
  }

  function inGame(game) {
    return io.sockets.clients("game:" + game.id);
  }

  function forSockets(room, callback) {
    io.sockets.clients(room).forEach(callback);
  }

  function joinIdle(user) {
    forSockets("user:" + user.uid, function (socket) {
      socket.join("idle");
    });
  }

  function leaveIdle(user) {
    forSockets("user:" + user.uid, function (socket) {
      socket.leave("idle");
    });
  }


  function joinGame(user, game) {
    forSockets("user:" + user.uid, function (socket) {
      socket.join("game:" + game.gid);
    });
  }

  function leaveGame(user, game) {
    forSockets("user:" + user.uid, function (socket) {
      socket.leave("game:" + game.id);
    });
  }

  function notify(sockets, message, data) {
    if (!Array.isArray(sockets)) {
      sockets = [sockets];
    }
    sockets.forEach(function (socket) {
      socket.emit(message, data);
    });
  }

  function notifyGame(sockets, game, status) {
    if (!Array.isArray(sockets)) {
      sockets = [sockets];
    }
    sockets.forEach(function (socket) {
      socket.emit("game", {
        status: status,
        object: game.forUser(socket.handshake.user)
      });
    });
  }

  function notifyGamesListOrError(sockets) {
    if (!Array.isArray(sockets)) {
      sockets = [sockets];
    }
    return function (error, games) {
      if (error) {
        notify(sockets, "error", "internal");
      } else {
        notify(sockets, "games:list", {
          filter : "available",
          objects: games
        });
      }
    };
  }

  return function (socket) {

    var user = socket.handshake.user;

    joinUser(socket, user);
    joinIdle(user);

    socket.on("games:list", function (data) {
      if (data.filter === "available") {
        gameService.listAvailable(notifyGamesListOrError(socket));
      }
    });

    socket.on("games:create", function () {
      gameService.create(user, function (error, game) {

        if (error) {
          socket.emit("game:createfailed", error);
          return;
        }

        leaveIdle(user);
        joinGame(user, game);

        notifyGame(inGame(game), game, "created");

        gameService.listAvailable(notifyGamesListOrError(inIdle()));
      });
    });

    socket.on("games:join", function (data) {
      gameService.join(user, data.gid, function (error, game, started) {

        if (error) {
          socket.emit("game:joinfailed", error);
          return;
        }

        notifyGame(inGame(game), started ? "started" : "userjoined", game);

        leaveIdle(user);
        joinGame(user, game);
        notifyGame(inUser(user), "current", game);

        gameService.listAvailable(notifyGamesListOrError(inIdle()));

      });
    });

    socket.on("game:leave", function () {
      gameService.leaveCurrent(user, function (error, game, removed) {

        if (error) {
          socket.emit("game:leavefail", error);
          return;
        }

        leaveGame(user, game);

        notifyGame(inGame(game), "userleft", game);

        notifyGame(inUser(user), "left", game);

        joinIdle(user);

        gameService.listAvailable(notifyGamesListOrError(inIdle()))
      });
    });


    socket.on("game:turn", function (data) {
      gameService.turnCurrent(user, data.cid, function (error, game, state) {

        if (error) {
          socket.emit("game:turnfailed", error);
          return;
        }

        notifyGame(inGame(game), state, game);
      });
    });


    socket.on("app:current", function () {
      gameService.getCurrent(user, function (error, game) {

        if (error) {
          socket.emit("error", "internal error");
          return;
        }

        if (game) {
          leaveIdle(user);
          joinGame(user, game);
          notifyGame(inUser(user), "current", game);
        } else {
          gameService.listAvailable(notifyGamesListOrError(socket))
        }
      });
    });

    socket.on("disconnect", function () {
      // TODO: notify game
    });
  }
};
