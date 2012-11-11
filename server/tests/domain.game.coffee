libpath = process.env["APP_COV"] ? "../lib-cov": "../lib"
should = require("should")
Game = require(libpath + "/domain/game")(require(libpath + "/deck"))

describe "Game", ->
  describe "#new", ->
    it "should create different instances", (done) ->
      game1 = new Game()
      game2 = new Game()
      should.ok(game1.getData() != game2.getData())

      game1 = new Game({a: 1})
      game2 = new Game({a: 1})
      should.ok(game1.getData() != game2.getData())

      done()

  describe "#setData", ->
    it "should not break data reference", (done) ->
      game = new Game()
      data = game.getData()
      game.setData({a: 1})
      should.ok(game.getData() == data)

      game = new Game({b: 2})
      data = game.getData()
      game.setData({a: 1})
      should.ok(game.getData() == data)

      done()
