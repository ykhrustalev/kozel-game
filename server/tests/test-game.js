var _ = require('underscore')._
  , mongoose = require("mongoose")
  , g = require("../game")
  , deck = require("../deck")
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

function createGame(u1, u2, u3, u4, callback) {
  Game.create(u1, function (error, game) {
    game._join(u2, function () {
      game._join(u3, function () {
        game._join(u4, function () {
          game.save(function (error, game) {
            if (error) {
              throw new Error("create game failed: " + error);
            }
            callback(game);
          });
        });
      });
    });
  });
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
    test.equals(nextPid("player1"), "player2");
    test.equals(nextPid("player2"), "player3");
    test.equals(nextPid("player3"), "player4");
    test.equals(nextPid("player4"), "player1");
    try {
      nextPid("abc");
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

  _join: function (test) {
    var user1 = createUser()
      , user2 = createUser()
      , user3 = createUser()
      , user4 = createUser()
      , game = new Game();

    function assertUser(game, user, pid, tid) {
      test.equals(game.players[pid].uid, user.uid, "user should be on correct place");
      test.equals(game.players[pid].tid, tid, "user should be in correct team");
    }

    game._join(user1, function (error, started) {
      test.ok(!error, "user should join without errors");
      test.ok(!started, "first joined user should not start the game");
      assertUser(game, user1, "player1", "team1");

      game._join(user1, function (error) {
        test.equals(error, g.errors.USER_ALREADY_IN_GAME, "second time join the game should raise error");

        game._join(user2, function (error, started) {
          test.ok(!error, "user should join without errors");
          test.ok(!started, "second joined user should not start the game");
          assertUser(game, user2, "player2", "team2");

          game._join(user3, function (error, started) {
            test.ok(!error, "user should join without errors");
            test.ok(!started, "third joined user should not start the game");
            assertUser(game, user3, "player3", "team1");

            game._join(user4, function (error, started) {
              test.ok(!error, "user should join without errors");
              test.ok(started, "fours joined user should start the game");
              assertUser(game, user4, "player4", "team2");

              game._join(user4, function (error) {
                test.equals(error, g.errors.GAME_HAS_NO_VACANT_PLACE, "adding extra users should raise error");

                test.done();
              });
            });
          });
        });
      });
    });
  },

  _requiresReshuffle: function (test) {
    var game = new Game()
      , cQ = deck.cidFor(deck.suites.Clubs, deck.types.Queen)
      , sQ = deck.cidFor(deck.suites.Spades, deck.types.Queen)
      , hQ = deck.cidFor(deck.suites.Hearts, deck.types.Queen)
      , dQ = deck.cidFor(deck.suites.Diamonds, deck.types.Queen);

    function assertReShuffle(game, cids1, cids2, cids3, cids4, reShuffle) {
      game.round.cards.player1 = cids1;
      game.round.cards.player2 = cids2;
      game.round.cards.player3 = cids3;
      game.round.cards.player4 = cids4;
      test.equals(game._requiresReshuffle(), reShuffle, "game should be shuffled correctly");
    }

    assertReShuffle(game, [cQ, sQ, hQ, dQ], [], [], [], true);
    assertReShuffle(game, [cQ, sQ], [], [hQ, dQ], [], true);
    assertReShuffle(game, [cQ, sQ], [hQ, dQ], [], [], false);

    test.done();
  },

  _getTurnWinnerPid: function (test) {
    var game = new Game()
      , turn = game.round.turn
      , s = deck.suites
      , t = deck.types
      , dA = deck.cidFor(s.Diamonds, t.Ace)
      , d10 = deck.cidFor(s.Diamonds, t.T10)
      , dK = deck.cidFor(s.Diamonds, t.King)
      , d8 = deck.cidFor(s.Diamonds, t.T8)
      , cJ = deck.cidFor(s.Clubs, t.Jack)
      , hA = deck.cidFor(s.Hearts, t.Ace);

    function assertWinner(cards, firstPid, winner) {
      turn.player1 = cards.shift();
      turn.player2 = cards.shift();
      turn.player3 = cards.shift();
      turn.player4 = cards.shift();
      turn.firstPid = firstPid;
      test.equals(game._getTurnWinnerPid(), winner, "turn should win player with most significant card");
    }

    assertWinner([dA, d10, dK, d8], "player1", "player1");
    assertWinner([dA, d10, dK, cJ], "player1", "player4");
    assertWinner([dA, d10, dK, hA], "player4", "player4");

    test.done();
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

  //TODO: complete
  _turn     : function (test) {
    var u1 = createUser()
      , u2 = createUser()
      , u3 = createUser()
      , u4 = createUser()
      , cids1 = ["d-Q", "c-8", "s-A", "s-K", "s-8", "h-K", "d-A", "d-9"]
      , cids2 = ["d-J", "c-10", "s-10", "h-A", "h-8", "h-7", "d-10", "d-7"]
      , cids3 = ["c-7", "h-J", "c-9", "s-9", "s-7", "h-10", "h-9", "d-K"]
      , cids4 = ["c-Q", "s-Q", "h-Q", "c-J", "s-J", "c-A", "c-K", "d-8"];

    test.ok(!_.intersection(cids1, cids2, cids3, cids4).length);


    var oldShuffle = deck.shuffle;

    deck.shuffle = function () {
      return [cids1, cids2, cids3, cids4];
    };

    createGame(u1, u2, u3, u4, function (game) {
      var cards = game.round.cards;
      test.equals(_.intersect(cards.player1, cids1).length, 8);
      test.equals(_.intersect(cards.player2, cids2).length, 8);
      test.equals(_.intersect(cards.player3, cids3).length, 8);
      test.equals(_.intersect(cards.player4, cids4).length, 8);

      test.equals(game.round.shuffledPlayer, "player4", "shuffled player should be correct");
      test.equals(game.round.turn.firstPid, "player1", "first player in game should be correct");
      test.equals(game.round.turn.currentPid, "player1", "first turn player in game should be correct");

      deck.shuffle = oldShuffle;
      test.done();
    });
  },

  // TODO: complete
//  _newRound: function (test) {
//
//    test.expect(11);
//
//    Game.create(createUser(), function (error, game) {
//      game._addPlayer(createUser());
//      game._addPlayer(createUser());
//      game._addPlayer(createUser());
//
//      game.save(function () {
//
//        game._newRound();
//        game.save(function () {
//
//          var firstPid = game._firstRoundTurnPid()
//            , round = game.round
//            , cards = round.cards;
//
//          test.ok(round.created);
//          test.equals(round.number, 1);
//          test.equals(round.shuffledPlayer, prevPid(firstPid));
//          test.equals(round.rate, 1);
//          test.equals(round.score.team1, 0);
//          test.equals(round.score.team2, 0);
//          test.equals(cards.player1.length, 8);
//          test.equals(cards.player2.length, 8);
//          test.equals(cards.player3.length, 8);
//          test.equals(cards.player4.length, 8);
//          test.equals(_.intersection(cards.player1, cards.player2, cards.player3, cards.player4).length, 0);
//
//          test.done();
//
//        }, function () {
//          test.done();
//        });
//
//      }, function () {
//        test.done();
//      });
//    });
//
//  },

  //TODO: complete
//  _newTurn: function (test) {
//
//    test.expect(8);
//
//    Game.create(createUser(), function (error, game) {
//      game._addPlayer(createUser());
//      game._addPlayer(createUser());
//      game._addPlayer(createUser());
//
//      game.save(function () {
//        game._newRound();
//        game._newTurn();
//        game.save(function () {
//
//          var firstPid = game._firstRoundTurnPid()
//            , turn = game.round.turn;
//
//          test.ok(turn.created);
//          test.equals(turn.number, 1);
//          test.equals(turn.firstPid, firstPid);
//          test.equals(turn.currentPid, firstPid);
//          test.ok(!turn.player1);
//          test.ok(!turn.player2);
//          test.ok(!turn.player3);
//          test.ok(!turn.player4);
//
//          test.done();
//
//        }, function () {
//          test.done();
//        });
//
//      }, function () {
//        test.done();
//      });
//    });
//
//  },

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
      game._join(p2, function () {
        game._join(p3, function () {
          game._join(p4, function () {
            test.equals("player1", game._getPidForUser(p1));
            test.equals("player2", game._getPidForUser(p2));
            test.equals("player3", game._getPidForUser(p3));
            test.equals("player4", game._getPidForUser(p4));
            test.done();
          });
        });
      });
    });
  }
};
