var _ = require('underscore')._
  , mongoose = require("mongoose")
  , g = require("../game")
  , connection
  , Game
  , prevPid = g.utils.prevPid
  , nextPid = g.utils.nextPid;

function createUser() {
  return {
    uid       : _.uniqueId(),
    first_name: "first_name_" + _.uniqueId(),
    last_name : "last_name_" + _.uniqueId()
  };
}

module.exports = {

  setUp: function (callback) {
    connection = mongoose.createConnection('mongodb://localhost/test_1');
    connection.once('open', function () {
      Game = g.model(connection);
      callback();
    });
  },

  tearDown: function (callback) {
    connection.db.dropDatabase(function () {
      mongoose.disconnect();
      callback();
    });
  },

  prevPid: function (test) {
    test.expect(5);
    test.equals(g.utils.prevPid("player1"), "player4");
    test.equals(g.utils.prevPid("player2"), "player1");
    test.equals(g.utils.prevPid("player3"), "player2");
    test.equals(g.utils.prevPid("player4"), "player3");
    try {
      g.utils.prevPid("abc");
    } catch (e) {
      test.ok(1);
    }
    test.done();
  },

  nextPid: function (test) {
    test.expect(5);
    test.equals(g.utils.nextPid("player1"), "player2");
    test.equals(g.utils.nextPid("player2"), "player3");
    test.equals(g.utils.nextPid("player3"), "player4");
    test.equals(g.utils.nextPid("player4"), "player1");
    try {
      g.utils.nextPid("abc");
    } catch (e) {
      test.ok(1);
    }
    test.done();
  },

  otherTid: function (test) {
    test.expect(3);
    test.equals(g.utils.otherTid("team1"), "team2");
    test.equals(g.utils.otherTid("team2"), "team1");
    try {
      g.utils.otherTid("team");
    } catch (e) {
      test.ok(1);
    }
    test.done();
  },

  listAvailable: function (test) {
    var game;

    test.expect(5);

    game = new Game();
    game.meta.active = false;
    game.meta.playersCount = 4;
    game.save(function () {
      game = new Game();
      game.meta.active = false;
      game.meta.playersCount = 3;
      game.save(function () {
        game = new Game();
        game.meta.active = false;
        game.save(function () {
          game = new Game();
          game.meta.active = true;
          game.save(function () {
            Game.listAvailable(function (error, games) {
              test.equals(games.length, 2, "found list of games should be correct");
              Game.listAvailable(function (error, games) {
                test.equals(games.length, 1, "found list should satisfy the limit");
                test.ok(games[0].id, "listed game should have id");
                test.ok(games[0].meta, "listed game should have meta");
                test.ok(games[0].players, "listed game should have meta");
                test.done();
              }, 1);
            });
          });
        });
      });
    });

  },

  create: function (test) {
    var user = createUser();

    test.expect(7);

    Game.create(user, function (error, game) {
      test.ok(!error, "game should be created without errors");

      var player = game.players.player1;
      test.equals(game.meta.playersCount, 1, "user should be added to game");
      test.equals(player.uid, user.uid, "user should have correct id");
      test.equals(player.name, user.first_name + " " + user.last_name, "user should have correct name in game");
      test.equals(player.tid, "team1", "user should be assigned to correct team");

      Game.create(user, function (error) {
        test.equals(error, g.errors.USER_ALREADY_JOINED_OTHER_GAME, "error: user is in game should be raised");
        game.finish(function (error) {
          Game.create(user, function (error, game) {
            test.ok(!error, "second user gaem should be created correctly");
            test.done();
          });
        });
      });
    });
  },

  finish: function (test) {
    test.expect(6);

    var game = new Game();
    game.save(function (error) {
      test.ok(!error, "game should save without errors");

      Game.findOne({_id: game.id}, function (error, found) {
        test.ok(!error, "game search should complete without errors");
        test.ok(found.id, "found game should be have id");
        test.equals(found.id, game.id, "found game should be the same as saved");

        found.finish(function (error) {
          test.ok(!error, "finish should complete without errors");

          Game.findOne({_id: game.id}, function (error, found) {
            test.ok(!found, "deleted game should not be found");
            test.done();
          });
        })
      });
    });
  },

  _addPlayer: function (test) {
    var user1 = createUser(),
      user2 = createUser(),
      user3 = createUser(),
      user4 = createUser(),
      game = new Game();

    function assertUser(game, pid, user, tid) {
      test.equals(game.players[pid].uid, user.uid, "wrong player's order in game");
      test.equals(game.players[pid].tid, tid, "wrong player's team in game");
    }

    game._addPlayer(user1, function (error) {

    });
    test.ok();
    test.equals(game.players.player1.tid, "team1");
    test.ok(!game._addPlayer(user1));
    test.ok(game._addPlayer(user2));
    test.ok(game._addPlayer(user3));
    test.ok(game._addPlayer(user4));
    test.ok(!game._addPlayer(createUser()), "5th player joined the game");

    assertUser(game, "player1", user1, "team1");
    assertUser(game, "player2", user2, "team2");
    assertUser(game, "player3", user3, "team1");
    assertUser(game, "player4", user4, "team2");

    test.done();
  },

  _start: function (test) {

    test.expect(3);

    Game.create(createUser(), function (error, game) {
      game._addPlayer(createUser());
      game._addPlayer(createUser());
      game._addPlayer(createUser());
      game.save(function () {
        test.ok(game._start(), "failed to start game");
        test.ok(!game._start(), "started already running game");

        Game.create(createUser(), function (error, game) {
          game._addPlayer(createUser());
          game._addPlayer(createUser());
          game.save(function () {
            test.ok(!game._start(), "started game with incomplete player set");
            test.done();
          });

        });
      }, function () {
        test.done();
      });
    });

  },

  _pidForCid: function (test) {
    var game = new Game()
      , mock = {
        round: {
          cards: {
            player1: ["a"],
            player2: ["b"],
            player3: ["c"],
            player4: ["d"]
          }
        }
      };

    test.equals(game._pidForCid.call(mock, "a"), "player1");
    test.equals(game._pidForCid.call(mock, "b"), "player2");
    test.equals(game._pidForCid.call(mock, "c"), "player3");
    test.equals(game._pidForCid.call(mock, "d"), "player4");
    test.done();
  },

  _firstRoundTurnPid: function (test) {
    var game = new Game()
      , mock = {
        round     : {
          cards: {
            player1: ["a"],
            player2: ["b"],
            player3: ["c"],
            player4: ["d-A"]
          }
        },
        _pidForCid: game._pidForCid
      };

    test.equals(game._firstRoundTurnPid.call(mock), "player4");
    test.done();
  },

  _newRound: function (test) {

    test.expect(11);

    Game.create(createUser(), function (error, game) {
      game._addPlayer(createUser());
      game._addPlayer(createUser());
      game._addPlayer(createUser());

      game.save(function () {

        game._newRound();
        game.save(function () {

          var firstPid = game._firstRoundTurnPid()
            , round = game.round
            , cards = round.cards;

          test.ok(round.created);
          test.equals(round.number, 1);
          test.equals(round.shuffledPlayer, prevPid(firstPid));
          test.equals(round.rate, 1);
          test.equals(round.score.team1, 0);
          test.equals(round.score.team2, 0);
          test.equals(cards.player1.length, 8);
          test.equals(cards.player2.length, 8);
          test.equals(cards.player3.length, 8);
          test.equals(cards.player4.length, 8);
          test.equals(_.intersection(cards.player1, cards.player2, cards.player3, cards.player4).length, 0);

          test.done();

        }, function () {
          test.done();
        });

      }, function () {
        test.done();
      });
    });

  },

  _newTurn: function (test) {

    test.expect(8);

    Game.create(createUser(), function (error, game) {
      game._addPlayer(createUser());
      game._addPlayer(createUser());
      game._addPlayer(createUser());

      game.save(function () {
        game._newRound();
        game._newTurn();
        game.save(function () {

          var firstPid = game._firstRoundTurnPid()
            , turn = game.round.turn;

          test.ok(turn.created);
          test.equals(turn.number, 1);
          test.equals(turn.firstPid, firstPid);
          test.equals(turn.currentPid, firstPid);
          test.ok(!turn.player1);
          test.ok(!turn.player2);
          test.ok(!turn.player3);
          test.ok(!turn.player4);

          test.done();

        }, function () {
          test.done();
        });

      }, function () {
        test.done();
      });
    });

  },

  findByUser: function (test) {
    var user = createUser();
    test.expect(4);
    Game.create(user, function (error, game) {
      Game.findByUser(user, function (error, games) {
        test.ok(games);
        test.ok(games.length === 1);
        test.ok(game.id);
        test.equals(game.id, games[0].id);
        test.done();
      });
    });
  },

  currentForUser: function (test) {
    var user = createUser();
    test.expect(1);
    Game.create(user, function (error, created) {
      Game.currentForUser(user, function (error, found) {
        test.equals(created.id, found.id);
        test.done();
      });
    });
  },

  _getPidForUser: function (test) {
    var p1 = createUser()
      , p2 = createUser()
      , p3 = createUser()
      , p4 = createUser();

    test.expect(4);
    Game.create(p1, function (error, game) {
      game._addPlayer(p2);
      game._addPlayer(p3);
      game._addPlayer(p4);
      test.equals("player1", game._getPidForUser(p1));
      test.equals("player2", game._getPidForUser(p2));
      test.equals("player3", game._getPidForUser(p3));
      test.equals("player4", game._getPidForUser(p4));
      test.done();
    });
  }
};