var _ = require('underscore')._,
    mongoose = require("mongoose"),
    g = require("../game"),
    db;

function createUser() {
  return {
    uid       : _.uniqueId(),
    first_name: "first_name_" + _.uniqueId(),
    last_name : "last_name_" + _.uniqueId()
  }
}



var Game ;

module.exports = {

  setUp: function (callback) {
    db = mongoose.createConnection('mongodb://localhost/test_1');
    db.once('open', function () {
      callback();
    });
    Game = g.model(db);
  },

  tearDown: function (callback) {
    mongoose.disconnect();
    callback();
  },


  testCreate: function (test) {
    var user = createUser(),
        game = Game.new(user);

    test.equals(game.meta.playersCount, 1);

    var player = game.players.player1;
    test.equals(player.uid, user.uid);
    test.equals(player.name, user.first_name + " " + user.last_name);
    test.equals(player.teamId, 1);

    test.done();

  },

  testAddPlayer: function (test) {
    var user = createUser(),
        game = new Game;

    test.ok(game.addPlayer(user));
    test.ok(!game.addPlayer(user));

    test.done();
  }
};