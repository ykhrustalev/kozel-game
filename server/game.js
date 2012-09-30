var _ = require("underscore")._,
  deck = require("./deck"),
  mongoose = require("mongoose");

var Schema = mongoose.Schema;

/**
 * Helper schema for player
 */
var PlayerSchema = {
  uid   : Number,
  teamId: Number, // 1|2
  name  : String
};

/**
 * Game schema, represents data structure in db
 */
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
    hasEquals   : Boolean
  },

  players: {
    player1: PlayerSchema,
    player2: PlayerSchema,
    player3: PlayerSchema,
    player4: PlayerSchema
  },

  sessions: {
    player1: String,
    player2: String,
    player3: String,
    player4: String
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
      created      : { type: Date, "default": Date.now },
      currentPlayer: String, // player{1,2,3,4}
      player1      : String,
      player2      : String,
      player3      : String,
      player4      : String
    },

    cards: {
      player1: [String],
      player2: [String],
      player3: [String],
      player4: [String]
    }

  }

});

var ERRORS = {
  USER_ALREADY_JOINED           : "USER_ALREADY_JOINED",
  USER_COULD_NOT_BE_JOINED      : "USER_COULD_NOT_BE_JOINED",
  USER_IS_ASSIGNED_TO_OTHER_GAME: "USER_IS_ASSIGNED_TO_OTHER_GAME"
};

/**
 * Returns previous player id from provided.
 * Client should take care of exception.
 *
 * @param playerId - current player
 * @return {String} "player{1|2|3|4}"
 */
function prevPlayer(playerId) {
  if (playerId === "player1") {
    return "player4";
  } else if (playerId === "player2") {
    return "player1";
  } else if (playerId === "player3") {
    return "player2";
  } else if (playerId === "player4") {
    return "player3";
  } else {
    throw new Error("unknown playerId " + playerId);
  }
}

/**
 * Returns next player id from provided.
 * Client should take care of exception.
 *
 * @param playerId - current player
 * @return {String} "player{1|2|3|4}"
 */
function nextPlayer(playerId) {
  if (playerId === "player1") {
    return "player2";
  } else if (playerId === "player2") {
    return "player3";
  } else if (playerId === "player3") {
    return "player4";
  } else if (playerId === "player4") {
    return "player1";
  } else {
    throw new Error("unknown playerId " + playerId);
  }
}


/**
 * Lists games available for join, ordered desc by create date.
 *
 * @param callback(games) - succed action,
 *                          `games` - collection of available games
 * @param limit           - collection size, default 10
 */
GameSchema.statics.listAvailable = function (callback, limit) {
  this.find()
    .where("meta.active").equals(false)
    .where("meta.playersCount").lt(4)
    .limit(limit || 10)
    .sort("+meta.created")
    .select("_id meta players")
    .exec(function (error, data) {
      callback(data);
    });
};

/**
 * Creates game from scratch
 *
 * @param user            - starter game
 * @param successCallback - succed action
 * @param errorCallback   - error action
 */
GameSchema.statics.create = function (user, successCallback, errorCallback) {
  var Game = this;
  Game.findByUser(user, function (games) {

    if (games && games.length) {
      errorCallback(ERRORS.USER_ALREADY_JOINED);
      return;
    }

    var game = new Game();
    if (!game.addPlayer(user)) {
      errorCallback(ERRORS.USER_COULD_NOT_BE_JOINED);
      return;
    }
    game.save(function () {
      successCallback(game);
    });

  });
};


/**
 * Starts game, shuffles cards ands prepares to the first round, does not
 * saves game.
 *
 * @return {Boolean}
 */
GameSchema.methods.start = function () {

  if (this.meta.active || this.meta.playersCount !== 4) {
    return false;
  }

  this.meta.active = true;
  this.meta.started = new Date();

  this.newRound();

  return true;
};

// TODO
GameSchema.methods.newRound = function (rate) {

  var split = deck.split(4),
    round = this.round,
    cards = round.cards,
    isFirstRound = !round.number,
    winner,
    firstHand;

  console.warn(this); //TODO: remove

  if (!isFirstRound) {
    winner = "team" + (round.score.team1 > round.score.team2 ? 1 : 2);
    this.meta.score[winner] += 2 * round.rate;
  }

  round.created = new Date();
  round.numver += 1;
  round.score.team1 = 0;
  round.score.team2 = 0;
  round.rate = rate || 1;

  cards.player1 = deck.getCardIds(split.shift());
  cards.player2 = deck.getCardIds(split.shift());
  cards.player3 = deck.getCardIds(split.shift());
  cards.player4 = deck.getCardIds(split.shift());

  if (isFirstRound) {
    firstHand = this.findPlayerByCard(
      deck.Suite.Diamonds,
      deck.Type.Ace
    );
    round.shuffledPlayer = prevPlayer(firstHand);
  } else {
    round.shuffledPlayer = nextPlayer(round.shuffledPlayer);
    firstHand = nextPlayer(round.shuffledPlayer);
  }

  this.newTurn(firstHand);
};

// TODO
GameSchema.methods.newTurn = function (firstPlayer) {

  var turn = this.round.turn;

  turn.created = new Date();
  turn.currentPlayer = firstPlayer;
  turn.player1 = "";
  turn.player2 = "";
  turn.player3 = "";
  turn.player4 = "";

};

// TODO test
GameSchema.methods.findPlayerByCard = function (suite, type) {

  var cardId = deck.cardIdFor(suite, type),
    cards = this.round.cards,
    playerId = cards.player1.indexOf(cardId) >= 0
      ? 1 : cards.player2.indexOf(cardId) >= 0
      ? 2 : cards.player3.indexOf(cardId) >= 0
      ? 3 : cards.player4.indexOf(cardId) >= 0
      ? 4 : -1;

  if (playerId === -1) {
    throw new Error("unknown card " + cardId);
  }

  return "player" + playerId;
};

/**
 * Checks wether game is ready to start.
 *
 * @return {Boolean}
 */
GameSchema.methods.canBeStarted = function () {
  return this.meta.playersCount === 4;
};

/**
 * Checks whether user is already joined the game
 *
 * @param user - user to check
 * @return {Boolean}
 */
GameSchema.methods.isUserJoined = function (user) {
  var p = this.players,
    uid = user.uid;
  return p.player1.uid === uid
    || p.player2.uid === uid
    || p.player3.uid === uid
    || p.player4.uid === uid;
};

/**
 * Assigns user to game with his session
 *
 * @param user      - user to assing
 * @param sessionId - users' session id
 * @return {Boolean}
 */
GameSchema.methods.addPlayer = function (user, sessionId) {

  if (this.meta.playersCount >= 4 || this.isUserJoined(user)) {
    return false;
  }

  this.meta.playersCount += 1;

  var playerId = "player" + this.meta.playersCount;

  this.players[playerId] = {
    uid   : user.uid,
    teamId: (this.meta.playersCount % 2) ? 1 : 2,
    name  : user.first_name + ' ' + user.last_name
  };

  this.sessions[playerId] = sessionId;

  return true;
};

//TODO: test
GameSchema.methods.getPlayerIdForUser = function (user) {
  var p = this.players,
    uid = user.uid,
    id;
  id = p.player1.uid === uid
    ? 1 : p.player2.uid === uid
    ? 2 : p.player3.uid === uid
    ? 3 : p.player4.uid === uid ? 4 : null;
  return id ? "player" + id : id;
};

//TODO: test
GameSchema.methods.getArrangedPlayersForPlayer = function (playerId) {
  var source = this.players,
    result = [],
    i;
  for (i = 0; i < 4; i += 1) {
    playerId = nextPlayer(playerId);
    result.push(source[playerId]);
  }
  return result;
};

//TODO: test
GameSchema.methods.forUser = function (user) {

  var playerId,
    exportData = {};

  playerId = this.getPlayerIdForUser(user);
  if (!playerId) {
    console.warn("player is not in game", user, this);
    return null;
  }

  exportData.players = this.getArrangedPlayersForPlayer(playerId);

  exportData.meta = this.meta;

  exportData.player = {
    cards   : this.round.cards[playerId],
    teamId  : this.players[playerId].teamId,
    playerId: playerId,
    turn    : this.round.turn && this.round.turn.currentPlayer && this.round.turn.currentPlayer === playerId
  };

  exportData.round = this.round;
  exportData.status = exportData.player.turn ? "Ваш ход" : "Ходит " + this.players[playerId].name;
  delete exportData.round.cards;

  return exportData;
};

//TODO: test findActiveGame
GameSchema.statics.findByUser = function (user, callback, limit, active) {
  var uid = user.uid,
    uidCondition = [
      { "players.player1.uid": uid },
      { "players.player2.uid": uid },
      { "players.player3.uid": uid },
      { "players.player4.uid": uid }
    ];
  this.find()
//    .where("meta.active").equals(!!active)
    .or(uidCondition)
    .limit(limit || 10)
    .sort("+meta.created")
    .exec(function (error, games) {
      callback(games);
    });
};

GameSchema.statics.currentForUser = function (user, callback) {
  this.findByUser(user, function (games) {
    callback(games && games.length ? games[0] : null);
  });
};

// TODO: test
GameSchema.statics.join = function (gameId, user, sessionId, successCallback, errorCallback) {
  var Game = this;

  this.currentForUser(user, function (game) {

    if (game) {
      errorCallback(ERRORS.USER_IS_ASSIGNED_TO_OTHER_GAME);
      return;
    }

    //TODO error to constants
    Game.findOne({"_id": gameId}, function (error, game) {
      if (error || !game) {
        errorCallback("game not found");
      } else if (game.isUserJoined(user)) {
        errorCallback("user already joined that game");
      } else if (!game.addPlayer(user, sessionId)) {
        errorCallback("user could not join the game");
      } else if (game.canBeStarted()) {
        if (game.start()) {
          game.save(function () {
            successCallback(game, true);
          });
        } else {
          errorCallback("failed to start game");
        }
      } else {
        game.save(function () {
          successCallback(game, false);
        });
      }
    });

  });
};

GameSchema.statics.prevPlayer = prevPlayer;

GameSchema.statics.nextPlayer = nextPlayer;

module.exports = {
  model: function (db) {
    return db.model("Game", GameSchema);
  },

  ERRORS: ERRORS
};
