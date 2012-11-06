module.exports = function (Game, gameDao) {

  var joinGame = function (game, user, callback) {
    game.join(user, function (error, started) {
      if (error) {
        callback(error);
        return;
      }

      gameDao.persist(game, function (error, game) {
        callback(error, game, started);
      });
    });
  };

  return {

    listAvailable: function (callback) {
      gameDao.findInactive(10, callback);
    },

    create: function (user, callback) {
      gameDao.findByUid(user.uid, 1, function (error, games) {
        if (error) {
          callback(error);
        } else if (games.length) {
          callback("user already in game");
        } else {
          joinGame(new Game(), user, callback);
        }
      });
    },

    join: function (user, gid, callback) {
      gameDao.findByUid(user.uid, 1, function (error, games) {
        if (error) {
          callback(error);
        } else if (games.length) {
          callback("user already in game");
        } else {
          gameDao.findById(gid, function (error, game) {
            if (error) {
              callback(error);
            } else {
              joinGame(game, user, callback);
            }
          });
        }
      });
    },

    getCurrent: function (user, callback) {
      gameDao.findByUid(user.uid, 1, function (error, games) {
        if (error) {
          callback(error);
        } else {
          callback(null, games.length ? games[0] : null);
        }
      });
    },

    leaveCurrent: function (user, callback) {
      gameDao.findByUid(user.uid, 1, function (error, games) {
        if (error) {
          callback(error);
        } else if (!games.length) {
          callback("user is not in game");
        } else {
          var game = games[0];
          game.leave(user, function (error, isEmpty) {
            if (error) {
              callback(error);
            } else if (isEmpty) {
              gameDao.remove(game, function (error) {
                callback(error, null);
              });
            } else {
              gameDao.persist(game, callback);
            }
          });
        }
      });
    },

    turnCurrent: function (user, cid, callback) {
      gameDao.findByUid(user.uid, 1, function (error, games) {
        if (error) {
          callback(error);
        } else if (!games.length) {
          callback("user is not in game");
        } else {
          var game = games[0];
          game.turn(user, cid, function (error, state, isComplete) {
            if (error) {
              callback(error);
            } else if (isComplete) {
              gameDao.remove(game, function (error) {
                callback(error, game);
              });
            } else {
              gameDao.persist(game, callback);
            }
          });
        }
      });
    }

  };
};
