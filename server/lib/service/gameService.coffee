# Game object, keeps logic
# @param deck - cards deck
module.exports = (deck) ->
  _ = require('lodash')

  # notable cards in game
  aceDiamonds = deck.cidFor(deck.suites.Diamonds, deck.types.Ace)
  queen = deck.cidFor(deck.suites.Clubs, deck.types.Queen)
  seven = deck.cidFor(deck.suites.Clubs, deck.types.T7)

  # errors that could be interested for client
  errors =
    USER_ALREADY_JOINED_OTHER_GAME: "user already joined other game",
    GAME_HAS_NO_VACANT_PLACE      : "no place to add player",
    USER_ALREADY_IN_GAME          : "already joined",
    USER_NOT_IN_GAME              : "user not in game"

  errors: errors

  # Add user to game if possible. If there is an error callback will be
  # executed with error argument.
  #
  # User is added on first vacant place in game.
  #
  # If game contains enough users after join game is started, started flag
  # is set to `true` value.
  #
  # Callback is executed with arguments:
  # {String} error - error message, presents only when error, possible values:
  #   GAME_HAS_NO_VACANT_PLACE - if there is no place for user
  #   USER_ALREADY_IN_GAME - if player already in game
  # {Boolean} started - flag if game was started
  #
  # @param user - user to join
  # @param callback - execution callback
  # @synchronous
  # @public
  join  : (game, user, callback) ->
    #TODO: unit tests
    meta    = game.meta
    players = game.players

    if meta.playersCount >= 4
      callback errors.GAME_HAS_NO_VACANT_PLACE
      return

    if @_getPidForUser user
      callback errors.USER_ALREADY_IN_GAME
      return

    meta.playersCount += 1

    if not players.player1.uid
      pid = 1
    else if not players.player2.uid
      pid = 2
    else if not players.player3.uid
      pid = 4
    else
      pid = 4
    pid = "player#{pid}"

    tid = if pid in ["player1", "player3"] then "team1" else "team2"

    players[pid] =
      uid   : user.uid,
      tid   : tid,
      name  : "#{user.first_name} #{user.last_name}",
      avatar: user.avatar

    if meta.playersCount isnt 4
      callback null, false
    else
      meta.active = true
      meta.started = new Date()
      @_newRound()
      @_newTurn()
      callback null, true

  # Make user leave the game.
  #
  # User is allowed to leave game only when it is not started.
  #
  # Callback is executed with arguments:
  # {String} error - error message, presents only when error
  #
  # @param user - user that leave
  # @param callback - execution callback
  # @synchronous
  # @public
  leave : (game, user, callback) ->
    #TODO: unit tests
    meta = game.meta
    players = game.players

    if meta.active
      callback "game already started"
      return

    pid = @_getPidForUser user
    if not pid
      callback errors.USER_NOT_IN_GAME
      return

    meta.playersCount -= 1
    players[pid] = null
    callback null, meta.playersCount is 0

  turn   : () ->
    #TODO: complete me

  forUser: (user) ->
    #TODO: complete me
