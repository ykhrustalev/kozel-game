var _ = require('underscore')._,
  mongoose = require("mongoose"),
  g = require("../game"),
  connection,
  Game;

function createUser() {
  return {
    uid       : _.uniqueId(),
    first_name: "first_name_" + _.uniqueId(),
    last_name : "last_name_" + _.uniqueId()
  };
}

module.exports = {

  setUp: function (callback) {
//    db = mongoose.connection('mongodb://localhost/test_1');
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

  testListAvailable: function (test) {
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

  testCreate: function (test) {
    var user = createUser();

    test.expect(4);

    Game.create(user, function (game) {
      var player = game.players.player1;

      test.equals(game.meta.playersCount, 1);
      test.equals(player.uid, user.uid);
      test.equals(player.name, user.first_name + " " + user.last_name);
      test.equals(player.teamId, 1);

      test.done();
    }, function () {
      test.done();
    });
  },

  testIsUserJoined: function (test) {
    var game = new Game(),
      user = createUser();
    game.addPlayer(user);
    test.ok(game.isUserJoined(user), "already joined user treated as new");
    test.ok(!game.isUserJoined(createUser()), "new user treated as joined");
    test.done();
  },

  testAddPlayer: function (test) {
    var user1 = createUser(),
      user2 = createUser(),
      user3 = createUser(),
      user4 = createUser(),
      game = new Game();

    function assertUser(game, playerId, user, teamId) {
      test.equals(game.players[playerId].uid, user.uid,
        "wrong player's order in game");
      test.equals(game.players[playerId].teamId, teamId,
        "wrong player's team in game");
      test.equals(game.sessions[playerId], user.sessionId,
        "wrong session assigned in game");
    }

    test.ok(game.addPlayer(user1));
    test.equals(game.players.player1.teamId, 1);
    test.ok(!game.addPlayer(user1));
    test.ok(game.addPlayer(user2));
    test.ok(game.addPlayer(user3));
    test.ok(game.addPlayer(user4));
    test.ok(!game.addPlayer(createUser()), "5th player joined the game");

    assertUser(game, "player1", user1, 1);
    assertUser(game, "player2", user2, 2);
    assertUser(game, "player3", user3, 1);
    assertUser(game, "player4", user4, 2);

    test.done();
  },

  testStart: function (test) {

    test.expect(3);

    Game.create(createUser(), function (game) {
      game.addPlayer(createUser());
      game.addPlayer(createUser());
      game.addPlayer(createUser());
      game.save(function () {
        test.ok(game.start(), "failed to start game");
        test.ok(!game.start(), "started already running game");

        Game.create(createUser(), function (game) {
          game.addPlayer(createUser());
          game.addPlayer(createUser());
          game.save(function () {
            test.ok(!game.start(), "started game with incomplete player set");
            test.done();
          });

        });
      }, function () {
        test.done();
      });
    });

  }

};