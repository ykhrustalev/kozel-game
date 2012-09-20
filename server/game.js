var _ = require("underscore")._,
  deck = require("./deck"),
  config = require("./config"),
  mongoose = require("mongoose");

var Schema = mongoose.Schema;

/**
 * Helper schema for player
 * @type {Object}
 */
var PlayerSchema = {
  uid   : Number,
  teamId: Number, // 1|2
  name  : String
};

/**
 * Game schema, how it is kept in db
 *
 * @type {Schema}
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


/**
 * Helper for passing error to callback.
 *
 * @param callback - callback
 * @param message  - erorr message
 */
function wrapError(callback, message) {
  callback(message);
}

/**
 * Returns previous player id from provided.
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
  Game.findByUser(user, function (error, games) {

    if (games && games.length) {
      wrapError(errorCallback, "user already joined");
      return;
    }

    var game = new Game();
    if (!game.addPlayer(user)) {
      wrapError(errorCallback, "user could not be joined");
      return;
    }
    game.save(function () {
      successCallback(game.forPlayer(user));
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


  if (isFirstRound) {
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

  this.players["player" + this.meta.playersCount] = {
    uid   : user.uid,
    teamId: (this.meta.playersCount % 2) ? 1 : 2,
    name  : user.first_name + ' ' + user.last_name
  };

  this.sessions["player" + this.meta.playersCount] = sessionId;

  return true;
};

GameSchema.methods.forPlayer = function (user) {
  //TODO: complete
  return this;
};

//TODO: remove
GameSchema.methods.exportForPlayer = function (user) {

  var self = this,
    uid = user.uid;

  var playerId = -1;
  for (var i = 0, len = this.players.length; i < len; i++) {
    if (this.players[i].uid == uid) {
      playerId = i;
      break;
    }
  }

  if (playerId === -1) {
    throw new Error("player out of scope", this, uid)
  }

  var teamId = (this.teams.team1.indexOf(playerId) >= 0) ? 0 : 1;

  var playerIds = [];
  if (playerId == 0) {
    playerIds = [1, 2, 3, 0];
  } else if (playerId == 1) {
    playerIds = [2, 3, 0, 1];
  } else if (playerId == 2) {
    playerIds = [3, 0, 1, 2];
  } else {
    playerIds = [0, 1, 2, 3];
  }

  var players = [];
  playerIds.forEach(function (id) {
    var name = self.players[id] ? self.players[id].name : "";
    players.push(name);
  });

  var turn = [];
  if (this.turn && this.turn.length) {
    playerIds.forEach(function (id) {
      turn.push(self.turn[id])
    });
  }

  var cards = [];
  if (this.hands && this.hands[playerId]) {
    cards = this.hands[playerId].cards;
  }


  return {
    score  : {
      team0: this.score["team" + teamId],
      team1: this.score["team" + (teamId ? 0 : 1)]
    },
    players: players,
    cards  : cards,
    turn   : turn,
    active : this.hands && this.hands.length
  };
};

//TODO: test
GameSchema.statics.findByUser = function (user, callback, limit) {
  this.find()
    .where("meta.active").equals(true)
    .or([
    { "players.player1.uid": user.uid },
    { "players.player2.uid": user.uid },
    { "players.player3.uid": user.uid },
    { "players.player4.uid": user.uid }
  ])
    .limit(limit || 10)
    .sort("+meta.created")
    .exec(callback);
};

// TODO: test
GameSchema.statics.join = function (gameId, user, sessionId, successCallback, errorCallback) {
  var Game = this;

  this.findByUser(user, function (error, games) {

    if (games)
      return wrapError(errorCallback, "user is assigned to other game");

    Game.findOne({"_id": gameId}, function (error, game) {

      if (error || !game) {
        wrapError(errorCallback, "game not found");
        return
      }

      if (game.isUserJoined(user))
        return wrapError(errorCallback, "user already joined that game");

      if (!game.addPlayer(user, sessionId))
        return wrapError(errorCallback, "user could not join the game");

      if (game.canBeStarted() && !game.start())
        return wrapError(errorCallback, "failed to start game");

      game.save(function () {
        successCallback(game);
      })
    });

  });
};

GameSchema.statics.prevPlayer = prevPlayer;

GameSchema.statics.nextPlayer = nextPlayer;

module.exports = {
  model: function (db) {
    return db.model("Game", GameSchema);
  }
};
