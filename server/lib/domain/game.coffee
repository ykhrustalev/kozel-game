module.exports = (connection) ->
  Schema = require("mongoose").Schema
  _ = require("lodash")

  PlayerSchema =
    uid   : String
    tid   : String
    name  : String
    avatar: String

  FlagsSchema =
    equals     : Boolean
    noScore    : Boolean
    queenCaught: Boolean

  ZeroedNumber =
    type     : Number
    "default": 0

  DateNow =
    type     : Date
    "default": Date.now

  # Game schema, represents data structure in db
  GameSchema = new Schema
    meta:
      created: DateNow
      started: Date

      active:
        type     : Boolean
        "default": false

      playersCount: ZeroedNumber

      score:
        team1: ZeroedNumber
        team2: ZeroedNumber

      flags:
        team1: FlagsSchema
        team2: FlagsSchema

    players:
      player1: PlayerSchema
      player2: PlayerSchema
      player3: PlayerSchema
      player4: PlayerSchema

    round:
      created: DateNow

      number: ZeroedNumber

      shuffledPlayer: String

      rate:
        type     : Number
        "default": 1

      score:
        team1: ZeroedNumber
        team2: ZeroedNumber

      turn:
        created   : DateNow
        number    : ZeroedNumber
        firstPid  : String
        currentPid: String
        player1   : String
        player2   : String
        player3   : String
        player4   : String

      cards:
        player1: [String]
        player2: [String]
        player3: [String]
        player4: [String]

  GameSchema.path("meta.active").index(true)
  GameSchema.path("players.player1.uid").index(true)
  GameSchema.path("players.player2.uid").index(true)
  GameSchema.path("players.player3.uid").index(true)
  GameSchema.path("players.player4.uid").index(true)

  schema = connection.model "Game", GameSchema

  # Query database for inactive games.
  # If error occurs error object is passed to callback.
  #
  # @param limit - max number of result objects
  # @param callback - execution callback
  findInactive: (limit, callback) ->
    schema.find()
      .where("meta.active").equals(false)
      .where("meta.playersCount").lt(4)
      .limit(limit)
      .sort("+meta.created")
      .select("_id meta players")
      .exec(callback)

  # Find games where user is in.
  # If error occurs error object is passed to callback.
  #
  # @param uid - user id to query
  # @param limit - query limit
  # @param callback - execution callback
  findByUid   : (uid, limit, callback) ->
    schema.find().or([
      "players.player1.uid": uid
      "players.player2.uid": uid
      "players.player3.uid": uid
      "players.player4.uid": uid
    ])
      .limit(limit or 10)
      .sort("+meta.created")
      .exec(callback)

  # Find game bu its `id`.
  # If error occurs error object is passed to callback.
  #
  # @param id - game id
  # @param callback - execution callback
  findById    : (id, callback) ->
    schema.findOne id: id, callback

  # Persists the game.
  # If is new game creates new db object otherwise merges with existing.
  # Uses `id` field as a primary key.
  # If error occurs error object is passed to callback.
  #
  # @param object - game to save
  # @param callback - execution callback
  persist     : (object, callback) ->
    object.save callback

  # Remove game from db.
  # If error occurs error object is passed to callback.
  #
  # @param game - game to remove
  # @param callback - execution callback
  remove      : (object, callback) ->
    schema.remove id: object.id, callback

  new: ->
    new schema()
