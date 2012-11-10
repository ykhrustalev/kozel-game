var Schema = require("mongoose").Schema
  , _ = require('lodash');

module.exports = function (connection, Game) {

  // Helpers
  var PlayerSchema = {
    uid   : String,
    tid   : String, // team{1|2}
    name  : String,
    avatar: String
  };

  var FlagsSchema = {
    equals     : Boolean,
    noScore    : Boolean,
    queenCaught: Boolean
  };

  // Game schema, represents data structure in db
  var GameSchema = new Schema({

    meta: {
      created     : { type: Date, "default": Date.now },
      started     : Date,
      active      : { type: Boolean, "default": false },
      playersCount: { type: Number, "default": 0 },
      score       : {
        team1: { type: Number, "default": 0 },
        team2: { type: Number, "default": 0 }
      },
      flags       : {
        team1: FlagsSchema,
        team2: FlagsSchema
      }
    },

    players: {
      player1: PlayerSchema,
      player2: PlayerSchema,
      player3: PlayerSchema,
      player4: PlayerSchema
    },

    round: {
      created: { type: Date, "default": Date.now },

      number: { type: Number, "default": 0 },

      shuffledPlayer: String,

      rate: { type: Number, "default": 1},

      score: {
        team1: { type: Number, "default": 0 },
        team2: { type: Number, "default": 0 }
      },

      turn: {
        created   : { type: Date, "default": Date.now },
        number    : { type: Number, "default": 0 },
        firstPid  : String,
        currentPid: String, // player{1,2,3,4}
        player1   : String,
        player2   : String,
        player3   : String,
        player4   : String
      },

      cards: {
        player1: [String],
        player2: [String],
        player3: [String],
        player4: [String]
      }

    }

  });

  var schema = connection.model("Game", GameSchema);

  /**
   * Convert db values to game object
   *
   * @param object
   * @return {*}
   * @private
   */
  function wrapSingle(object, model) {
    if (model) {
      model.setData(object);
      return model;
    } else {
      return new Game(object);
    }
  }

  /**
   * Convert db values to game objects
   *
   * @param objects
   * @return {Array}
   * @private
   */
  function wrapCollection(objects) {
    var entities = [];
    objects.forEach(function (object) {
      entities.push(wrapSingle(object));
    });
    return entities;
  }

  /**
   * Save game state to db.
   * If error occurs error object is passed to callback.
   *
   * @param object
   * @param game
   * @param callback
   * @private
   */
  function persist(object, game, callback) {
    _.defaults(object, game.getData());
    object.save(function (error, object) {
      if (error) {
        callback(error);
      } else {
        callback(null, wrapSingle(object, game));
      }
    })
  }

  return {

    /**
     * Query database for inactive games.
     * If error occurs error object is passed to callback.
     *
     * @param limit - max number of result objects
     * @param callback - execution callback
     * @public
     */
    findInactive: function (limit, callback) {
      schema.find()
        .where("meta.active").equals(false)
        .where("meta.playersCount").lt(4)
        .limit(limit)
        .sort("+meta.created")
        .select("_id meta players")
        .exec(function (error, objects) {
          if (error) {
            callback(error);
          } else {
            callback(null, wrapCollection(objects));
          }
        });
    },

    /**
     * Find games where user is in.
     * If error occurs error object is passed to callback.
     *
     * @param uid - user id to query
     * @param limit - query limit
     * @param callback - execution callback
     * @public
     */
    findByUid: function (uid, limit, callback) {
      schema.find().or([
        { "players.player1.uid": uid },
        { "players.player2.uid": uid },
        { "players.player3.uid": uid },
        { "players.player4.uid": uid }
      ])
        .limit(limit || 10)
        .sort("+meta.created")
        .exec(function (error, object) {
          if (error) {
            callback(error);
          } else {
            callback(null, wrapCollection(object));
          }
        });
    },

    /**
     * Find game bu its `id`.
     * If error occurs error object is passed to callback.
     *
     * @param id - game id
     * @param callback - execution callback
     * @public
     */
    findById: function (id, callback) {
      schema.findOne({id: id}, function (error, object) {
        if (error) {
          callback(error);
        } else {
          callback(null, wrapSingle(object));
        }
      });
    },

    /**
     * Persists the game state.
     * If is new game creates new db object otherwise merges with existing.
     * Uses `id` field as a primary key.
     * If error occurs error object is passed to callback.
     *
     * @param game - game to save
     * @param callback - execution callback
     * @public
     */
    persist: function (game, callback) {
      var id = game.getData().id;
      if (!id) {
        persist(new schema(), game, callback);
      } else {
        schema.findOne({_id: id}, function (error, object) {
          if (error) {
            callback(error);
          } else {
            persist(object, game, callback);
          }
        });
      }
    },

    /**
     * Remove game from db.
     * If error occurs error object is passed to callback.
     *
     * @param game - game to remove
     * @param callback - execution callback
     * @public
     */
    remove: function (game, callback) {
      schema.remove({id: game.id}, callback);
    }

  }
};
