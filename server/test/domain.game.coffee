libpath = if process.env.APP_COV then "../lib-cov" else "../lib"
should = require "should"
mongoose = require "mongoose"
gameDomain = require "#{libpath}/domain/game"
_ = require("lodash")

describe "domain.game", () ->
  connection = null
  domain = null

  assertModel = (model) ->
    model.should.have.property("_id")
    model.should.have.property("meta")
    model.should.have.property("players")
    model.should.have.property("round")

  assertModelArray = (models) ->
    assertModel(model) for model in models

  before (done) ->
    connection = mongoose.createConnection('mongodb://localhost/test_db')
    connection.once 'open', () ->
      domain = gameDomain(connection)
      done()

  after (done) ->
    connection.db.dropDatabase () ->
      mongoose.disconnect()
      done()

  beforeEach (done) ->
    connection.db.dropDatabase () ->
      done()

  bulkPersist = (objects, callback) ->
    cnt = objects.length
    result = []
    objects.forEach (object, index) ->
      domain.persist object, (error, model) ->
        if error
          throw error
        cnt--
        result[index] = model
        if not cnt
          callback result

  describe "#new()", () ->
    it "should provide correct model", (done) ->
      assertModel domain.new()
      done()

  describe "#persist()", () ->
    it "should save new/existing object without errors", (done) ->
      game = domain.new()
      domain.persist game, (error, savedGame) ->
        should.not.exist error
        assertModel savedGame
        savedId = savedGame.id
        should.exist savedId

        domain.persist game, (error, savedGame) ->
          should.not.exist error
          assertModel savedGame
          should.exist savedGame.id
          savedGame.id.should.equal savedId
          done()

  describe "#findInactive", () ->
    it "should list empty query", (done) ->
      domain.findInactive 2, (error, games) ->
        should.not.exist(error)
        games.should.be.instanceOf(Array)
        done()

    it "should respect limit", (done) ->
      bulkPersist [domain.new(), domain.new(), domain.new()], (models) ->
        domain.findInactive 2, (error, models) ->
          should.not.exist error
          models.should.have.length 2
          assertModelArray models

          domain.findInactive 10, (error, models) ->
            should.not.exist error
            models.should.have.length 3
            assertModelArray models
            done()

    it "should respect game conditions", (done) ->
      game1 = domain.new()
      _.merge game1,
        meta:
          active      : false
          playersCount: 3

      game2 = domain.new()
      _.merge game2,
        meta:
          active      : false
          playersCount: 4

      game3 = domain.new()
      _.merge game3,
        meta:
          active      : true
          playersCount: 3

      bulkPersist [game1, game2, game3], (models) ->
        domain.findInactive 10, (error, models) ->
          should.not.exist error
          models.should.have.length 1
          assertModelArray models
          done()

    it "should respect game order", (done) ->
      bulkPersist [domain.new(), domain.new(), domain.new()], (savedModels) ->
        domain.findInactive 10, (error, models) ->
          should.not.exist error
          models.should.have.length 3
          for i in [0...savedModels.length]
            savedModels[i].id.should.equal models[i].id
          done()
