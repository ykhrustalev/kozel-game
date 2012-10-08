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
      game.save(function () {
        game = new Game();
        game.meta.active = false;
        game.save(function () {
          game = new Game();
          game.meta.active = true;
          game.save(function () {
            Game.listAvailable(function (games) {
              test.equals(games.length, 2);
              Game.listAvailable(function (games) {
                test.equals(games.length, 1);
                test.ok(games[0]._id);
                test.ok(games[0].meta);
                test.ok(games[0].players);
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

    test.expect(4);

    Game.create(user, function (game) {
      var player = game.players.player1;

      test.equals(game.meta.playersCount, 1);
      test.equals(player.uid, user.uid);
      test.equals(player.name, user.first_name + " " + user.last_name);
      test.equals(player.tid, "team1");

      test.done();
    }, function () {
      test.done();
    });
  },

  isUserJoined: function (test) {
    var game = new Game(),
      user = createUser();
    game._addPlayer(user);
    test.ok(game.isUserJoined(user), "already joined user treated as new");
    test.ok(!game.isUserJoined(createUser()), "new user treated as joined");
    test.done();
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

    test.ok(game._addPlayer(user1));
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

    Game.create(createUser(), function (game) {
      game._addPlayer(createUser());
      game._addPlayer(createUser());
      game._addPlayer(createUser());
      game.save(function () {
        test.ok(game._start(), "failed to start game");
        test.ok(!game._start(), "started already running game");

        Game.create(createUser(), function (game) {
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

    Game.create(createUser(), function (game) {
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

  findByUser: function (test) {
    var user = createUser();
    test.expect(4);
    Game.create(user, function (game) {
      Game.findByUser(user, function (games) {
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
    Game.create(user, function (created) {
      Game.currentForUser(user, function (found) {
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
    Game.create(p1, function (game) {
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