var libpath = process.env["APP_COV"] ? "../lib-cov" : "../lib"
  , should = require("should")
  , Game = require(libpath + "/domain/game")(require(libpath + "/deck"));

describe("Game", function () {

  describe("#new", function () {

    it("should create different instances", function (done) {
      var game1, game2;

      game1 = new Game();
      game2 = new Game();
      should.ok(game1.getData() != game2.getData());

      game1 = new Game({a: 1});
      game2 = new Game({a: 1});
      should.ok(game1.getData() != game2.getData());

      done();
    });

  });


  describe("#setData", function () {

    it("should not break data reference", function (done) {
      var game, data;

      game = new Game();
      data = game.getData();
      game.setData({a: 1});
      should.ok(game.getData() == data);

      game = new Game({b: 2});
      data = game.getData();
      game.setData({a: 1});
      should.ok(game.getData() == data);

      done();
    });

  });

});
