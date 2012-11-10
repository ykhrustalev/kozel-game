var _ = require('lodash');

/**
 * Game object, keeps logic
 * @param deck - cards deck
 * @return {Function} game constructor
 */
module.exports = function (deck) {

  // notable cards in game
  var aceDiamonds = deck.cidFor(deck.suites.Diamonds, deck.types.Ace)
    , queen = deck.cidFor(deck.suites.Clubs, deck.types.Queen)
    , seven = deck.cidFor(deck.suites.Clubs, deck.types.T7);

  // errors that could be interested for client
  var errors = {
    USER_ALREADY_JOINED_OTHER_GAME: "user already joined other game",
    GAME_HAS_NO_VACANT_PLACE      : "no place to add player",
    USER_ALREADY_IN_GAME          : "already joined",
    USER_NOT_IN_GAME              : "user not in game"
  };


  // Game data schema with helpers

  var playerDefaults = {
    uid   : "",
    tid   : "",
    name  : "",
    avatar: ""
  };

  var flagsDefaults = {
    equals     : false,
    noScore    : false,
    queenCaught: false
  };

  var gameDefaults = {

    meta: {
      created     : null,
      started     : null,
      active      : false,
      playersCount: 0,
      score       : {
        team1: 0,
        team2: 0
      },
      flags       : {
        team1: flagsDefaults,
        team2: flagsDefaults
      }
    },

    players: {
      player1: playerDefaults,
      player2: playerDefaults,
      player3: playerDefaults,
      player4: playerDefaults
    },

    round: {

      created       : null,
      number        : 0,
      shuffledPlayer: "",
      rate          : 1,

      score: {
        team1: 0,
        team2: 0
      },

      turn: {
        created   : null,
        number    : 0,
        firstPid  : "",
        currentPid: "",
        player1   : "",
        player2   : "",
        player3   : "",
        player4   : ""
      },

      cards: {
        player1: [],
        player2: [],
        player3: [],
        player4: []
      }

    }
  };

  /**
   * @param {Object} data - game state
   * @constructor
   */
  function Game(data) {
    this.setData(data);
  }

  Game.prototype = {

    // error messages for game
    errors: errors,

    /**
     * Set game state.
     *
     * @param data - new game state
     * @public
     */
    setData: function (data) {
      this.data = _.merge(_.merge((this.data || {}), gameDefaults), (data || {}));
      this.data.meta.created = this.data.meta.created || Date.now();
    },

    /**
     * Return game state object
     *
     * @return Object
     * @public
     */
    getData: function () {
      return this.data;
    },

    /**
     * Add user to game if possible. If there is an error callback will be
     * executed with error argument.
     *
     * User is added on first vacant place in game.
     *
     * If game contains enough users after join game is started, started flag
     * is set to `true` value.
     *
     * Callback is executed with arguments:
     * {String} error - error message, presents only when error, possible values:
     *   GAME_HAS_NO_VACANT_PLACE - if there is no place for user
     *   USER_ALREADY_IN_GAME - if player already in game
     * {Boolean} started - flag if game was started
     *
     * @param user - user to join
     * @param callback - execution callback
     * @synchronous
     * @public
     */
    join: function (user, callback) {
      //TODO: unit tests
      var meta = this.data.meta
        , players = this.data.players;

      if (meta.playersCount >= 4) {
        callback(errors.GAME_HAS_NO_VACANT_PLACE);
        return;
      }

      if (this._getPidForUser(user)) {
        callback(errors.USER_ALREADY_IN_GAME);
        return;
      }

      meta.playersCount += 1;

      var pid = "player" + (!players.player1.uid ? 1 : !players.player2.uid ? 2 : !players.player3.uid ? 3 : 4);
      var tid = ["player1", "player3"].indexOf(pid) >= 0 ? "team1" : "team2";
      players[pid] = {
        uid   : user.uid,
        tid   : tid,
        name  : user.first_name + ' ' + user.last_name,
        avatar: user.avatar
      };

      if (meta.playersCount !== 4) {
        callback(null, false);
      } else {
        meta.active = true;
        meta.started = new Date();
        this._newRound();
        this._newTurn();
        callback(null, true);
      }
    },

    /**
     * Make user leave the game.
     *
     * User is allowed to leave game only when it is not started.
     *
     * Callback is executed with arguments:
     * {String} error - error message, presents only when error
     *
     * @param user - user that leave
     * @param callback - execution callback
     * @synchronous
     * @public
     */
    leave: function (user, callback) {
      //TODO: unit tests
      var meta = this.data.meta
        , players = this.data.players;

      if (meta.active) {
        callback("game already started");
        return;
      }

      var pid = this._getPidForUser(user);
      if (!pid) {
        callback(errors.USER_NOT_IN_GAME);
        return;
      }

      meta.playersCount -= 1;
      players[pid] = null;
      callback(null, meta.playersCount === 0);
    },

    turn: function () {
      //TODO: complete me

    },

    forUser: function (user) {
      //TODO: complete me

    }
  };

  return Game;
};
