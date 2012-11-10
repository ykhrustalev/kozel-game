var libpath = process.env["APP_COV"] ? "../lib-cov" : "../lib"
  , should = require("should")
  , mongoose = require("mongoose")
  , Game = require(libpath + "/domain/game")(require(libpath + "/deck"))
  , Dao = require(libpath + "/dao/gameDao");

function assertModel(model) {
  model.should.be.instanceof(Game);
  model.getData().should.have.property("_id");
  model.getData().should.have.property("meta");
  model.getData().should.have.property("players");
  model.getData().should.have.property("round");
}

function assertModelArray(models) {
  models.forEach(function (model) {
    assertModel(model);
  })
}

describe("gameDao", function () {

  var connection
    , dao;

  before(function (done) {
    console.log("before called");
    connection = mongoose.createConnection('mongodb://localhost/test_db');
    connection.once('open', function () {
      dao = Dao(connection, Game);
      done();
    });
  });

  after(function (done) {
    connection.db.dropDatabase(function () {
      mongoose.disconnect();
      done();
    });
  });

  beforeEach(function (done) {
    connection.db.dropDatabase(function () {
      done();
    });
  });

  function bulkPersist(objects, callback) {
    var cnt = objects.length
      , result = [];
    objects.forEach(function (object, index) {
      dao.persist(object, function (error, model) {
        if (error) {
          throw error;
        }
        cnt--;
        result[index] = model;
        if (!cnt) {
          callback(result);
        }
      });
    });
  }

  describe("#persist()", function () {

    it("should save new/existing object without errors", function (done) {
      var game = new Game();
      dao.persist(game, function (error, savedGame) {
        should.not.exist(error);
        assertModel(savedGame);
        var savedId = savedGame.getData().id;
        savedId.should.exist;

        dao.persist(game, function (error, savedGame) {
          should.not.exist(error);
          assertModel(savedGame);
          savedGame.getData().id.should.exist;
          savedGame.getData().id.should.equal(savedId);
          done();
        });

      });
    });

  });

  describe("#findInactive", function () {

    it("should list empty query", function (done) {
      dao.findInactive(2, function (error, games) {
        should.not.exist(error);
        games.should.be.instanceOf(Array);
        done();
      });
    });

    it("should respect limit", function (done) {
      bulkPersist([new Game(), new Game(), new Game()], function (models) {
        dao.findInactive(2, function (error, models) {
          should.not.exist(error);
          models.should.have.length(2);
          assertModelArray(models);

          dao.findInactive(10, function (error, models) {
            should.not.exist(error);
            models.should.have.length(3);
            assertModelArray(models);
            done();
          });

        });
      });
    });

    it("should respect game conditions", function (done) {
      var game1 = new Game({
        meta: {
          active      : false,
          playersCount: 3
        }
      });
      console.log("game 1: ", game1.data.meta.playersCount);
      var game2 = new Game({
        meta: {
          active      : false,
          playersCount: 4
        }
      });

      var game3 = new Game({
        meta: {
          active      : true,
          playersCount: 3
        }
      });

      [game1, game2, game3].forEach(function (m) {
        console.log(m.data.meta, m.data.id);
      })

      bulkPersist([game1, game2, game3], function (models) {
        dao.findInactive(10, function (error, models) {
          models.forEach(function (m) {
            console.log(m.data.meta, m.data.id);
          })

          should.not.exist(error);
          models.should.have.length(1);
          assertModelArray(models);
          done();
        });
      });
    });

    it("should respect game order", function (done) {
      bulkPersist([new Game(), new Game(), new Game()], function (savedModels) {
        dao.findInactive(10, function (error, models) {
          should.not.exist(error);
          models.should.have.length(3);
          for (var i = 0, len = savedModels.length; i < len; i++) {
            savedModels[i].getData().id.should.equal(models[i].getData().id);
          }
          done();
        });
      });
    });
  });

});
