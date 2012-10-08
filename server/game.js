var _ = require("underscore")._
  , deck = require("./deck")
  , mongoose = require("mongoose")
  , Schema = mongoose.Schema;

// Helper schema for player
var PlayerSchema = {
  uid : Number,
  tid : String, // team{1|2}
  name: String
};

// Game schema, represents data structure in db
var GameSchema = new Schema({

  meta: {
    created     : { type: Date, "default": Date.now },
    started     : Date,
    active      : { type: Boolean, "default": false },
    playersCount: { type: Number, "default": 0 },
    score       : {
      team1: { type: Number, "default": 0 }, //TODO: assign after turn complete
      team2: { type: Number, "default": 0 }  //TODO: assign after turn complete
    },
    hasEquals   : { type: Boolean, "default": false },
    hasNoScore  : { type: Boolean, "default": false }
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

var ERRORS = {
  USER_ALREADY_JOINED_THE_GAME  : "user already joined the game",
  USER_FAILED_TO_JOIN_THE_GAME  : "user failed to join the game",
  USER_ALREADY_JOINED_OTHER_GAME: "user already joined other game",
  USER_NOT_IN_GAME              : "user not in game",
  GAME_NOT_FOUND                : "game not found"
};

/**
 * Returns previous player id from provided.
 * Client should take care of exception.
 *
 * @param pid - current player
 * @return {String} "pid{1|2|3|4}"
 */
function prevPid(pid) {
  switch (pid) {
    case "player1":
      return "player4";
    case "player2":
      return "player1";
    case "player3":
      return "player2";
    case "player4":
      return "player3";
    default:
      throw new Error("unknown pid " + pid);
  }
}

/**
 * Returns next player id from provided.
 * Client should take care of exception.
 *
 * @param {String} pid - current player
 * @return {String} "pid{1|2|3|4}"
 */
function nextPid(pid) {
  switch (pid) {
    case "player1":
      return "player2";
    case "player2":
      return "player3";
    case "player3":
      return "player4";
    case "player4":
      return "player1";
    default:
      throw new Error("unknown pid " + pid);
  }
}

// TODO: comments
function otherTid(tid) {
  switch (tid) {
    case "team1":
      return "team2";
    case "team2":
      return "team1";
    default:
      throw new Error("unknown tid " + tid);
  }
}


/**
 * Lists games available for join, ordered desc by create date.
 *
 * @param callback(games) - succeed action,
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
 * @param success - succed action
 * @param fail   - error action
 */
GameSchema.statics.create = function (user, success, fail) {
  var Game = this;
  Game.currentForUser(user, function (game) {

    if (game) {
      fail(ERRORS.USER_ALREADY_JOINED_OTHER_GAME);
      return;
    }

    game = new Game();
    if (!game._addPlayer(user)) {
      fail(ERRORS.USER_FAILED_TO_JOIN_THE_GAME);
      return;
    }

    game.save(function () {
      success(game);
    });

  });
};


GameSchema.statics.currentForUser = function (user, callback) {
  this.findByUser(user, function (games) {
    callback(games && games.length ? games[0] : null);
  });
};

// TODO: test
GameSchema.statics.join = function (gameId, user, success, fail) {
  var Game = this;

  this.currentForUser(user, function (game) {

    if (game) {
      fail(ERRORS.USER_ALREADY_JOINED_OTHER_GAME);
      return;
    }

    Game.findOne({"_id": gameId}, function (error, game) {
      if (error || !game) {
        fail(ERRORS.GAME_NOT_FOUND);

      } else if (game.isUserJoined(user)) {
        fail(ERRORS.USER_ALREADY_JOINED_THE_GAME);

      } else if (!game._addPlayer(user)) {
        fail(ERRORS.USER_FAILED_TO_JOIN_THE_GAME);

      } else if (game.meta.playersCount === 4) {
        if (game._start()) {
          game.save(function () {
            success(game, true);
          });
        } else {
          fail("failed to start game");
        }
      } else {
        game.save(function () {
          success(game, false);
        });
      }
    });

  });
};

GameSchema.statics.turn = function (user, cardId, success, fail) {
  this.currentForUser(user, function (game) {
    if (!game) {
      fail(ERRORS.USER_NOT_IN_GAME);
      return;
    }

    //TODO: check game conditions
    var cards = game.round.cards
      , turn = game.round.turn
      , pid = game._getPidForUser(user);

    if (!pid) {
      fail("user is not in game");
      return;
    }

    if (turn.currentPid !== pid) {
      fail("user is not allowed to turn");
      return;
    }

    if (turn[pid]) {
      fail("user already made turn");
      return;
    }

    if (cards[pid].indexOf(cardId) < 0) {
      fail("user is trying to use not his cards, probably cheating");
      return;
    }


    // TODO: check card is suitable


    turn[pid] = cardId;
    cards[pid] = _.without(cards[pid], cardId);
    turn.currentPid = nextPid(pid);

    if (turn.player1 && turn.player2 && turn.player3 && turn.player4) {
      game._completeTurn();
      if (cards.player1.length === 0) {
        game._completeRound();
      } else {
        game._newTurn();
      }
    }

    game.save(function () {
      success(game, "current"); // TODO: use callback names as io messages
    });
  });
};


//TODO: test
GameSchema.methods.forUser = function (user) {

  var pid = this._getPidForUser(user);
  if (!pid) {
    console.warn("player is not in game", user, this);
    return null;
  }

  var currTurnPid = this.round.turn.currentPid
    , isTurn = currTurnPid === pid
    , players = {}
    , turn = {}
    , tid = this.players[pid].tid;

  for (var i = 1, pid = nextPid(pid);
       i <= 4;
       pid = nextPid(pid), i++) {
    var order = "player" + i;
    players[order] = this.players[pid].name || "свободно";
    turn[order] = this.round.turn[pid];
  }

  return {
    meta        : this.meta,
    cards       : this.round.cards[pid],
    cardsAllowed: this.meta.active ? this._getCardsAllowed(pid) : [],
    isTurn      : isTurn,
    status      : !this.meta.active ? null : (isTurn ? "Ваш ход" : "Ходит " + this.players[currTurnPid].name),
    players     : players,
    turn        : turn,

    gameScore: {
      team1: this.meta.score[tid],
      team2: this.meta.score[otherTid(tid)]
    },

    roundScore: {
      team1: this.round.score[tid],
      team2: this.round.score[otherTid(tid)]
    }
  };
};

/**
 * Starts game, shuffles cards ands prepares to the first round, does not
 * saves game.
 *
 * @return {Boolean}
 */
GameSchema.methods._start = function () {

  if (this.meta.active || this.meta.playersCount !== 4) {
    return false;
  }

  this.meta.active = true;
  this.meta.started = new Date();

  this._newRound();
  console.warn(this.round);
  this._newTurn();
  console.warn(this.round);

  return true;
};

// TODO: unit test
GameSchema.methods._newRound = function (rate) {

  var split = deck.shuffle(4)
    , round = this.round;

  round.created = new Date();
  round.number += 1;
  round.score.team1 = 0;
  round.score.team2 = 0;
  round.rate = rate || 1;

  //TODO: check shuffle validity

  round.cards.player1 = split.shift();
  round.cards.player2 = split.shift();
  round.cards.player3 = split.shift();
  round.cards.player4 = split.shift();

  if (round.shuffledPlayer) {
    round.shuffledPlayer = nextPid(round.shuffledPlayer);
  } else {
    round.shuffledPlayer = prevPid(this._firstRoundTurnPid());
  }
};


// TODO: unit test
GameSchema.methods._newTurn = function () {
  var turn = this.round.turn;

  turn.created = new Date();
  turn.number += 1;
  turn.player1 = "";
  turn.player2 = "";
  turn.player3 = "";
  turn.player4 = "";
  turn.firstPid = turn.currentPid = nextPid(this.round.shuffledPlayer);
};

// TODO: unit test
GameSchema.methods._completeRound = function () {

  var round = this.round
    , score1 = round.score.team1
    , score2 = round.score.team2;

  if (score1 === score2) {
    this.round.rate *= 2;
  } else {
    var minScore = Math.min(score1, score2)
      , value = minScore === 0 ? 6 : minScore <= 30 ? 4 : 2;
    this.meta.score[score1 > score2 ? "team2" : "team1"] += value * round.rate;
  }
};

GameSchema.methods._completeTurn = function () {
  // TODO: Most significant card function
  var turn = this.round.turn
    , winnerPid = "player1"
    , winnerTid = this.players[winnerPid].tid
    , score;

  // TODO: 7+Q case handle on turn function, not here

  score = deck.getScore(turn.player1)
    + deck.getScore(turn.player2)
    + deck.getScore(turn.player3)
    + deck.getScore(turn.player4);

  this.round.score[winnerTid] += score;
  turn.firstPid = turn.currentPid = winnerPid;
};

// TODO unit test
GameSchema.methods._pidForCid = function (cid) {

  var cards = this.round.cards
    , pid = cards.player1.indexOf(cid) >= 0 ? 1
      : cards.player2.indexOf(cid) >= 0 ? 2
      : cards.player3.indexOf(cid) >= 0 ? 3
      : cards.player4.indexOf(cid) >= 0 ? 4
      : null;

  if (pid === null) {
    throw new Error("unknown card " + cid);
  }

  return "player" + pid;
};

// TODO: unit test
GameSchema.methods._firstRoundTurnPid = function () {
  return this._pidForCid(deck.cardIdFor(
    deck.Suites.Diamonds,
    deck.Types.Ace
  ));
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
 * @return {Boolean}
 */
GameSchema.methods._addPlayer = function (user) {

  if (this.meta.playersCount >= 4 || this.isUserJoined(user)) {
    return false;
  }

  this.meta.playersCount += 1;

  var playerId = "player" + this.meta.playersCount;

  this.players[playerId] = {
    uid : user.uid,
    tid : "team" + ((this.meta.playersCount % 2) ? 1 : 2),
    name: user.first_name + ' ' + user.last_name
  };

  return true;
};

GameSchema.methods._getPidForUser = function (user) {
  var p = this.players
    , uid = user.uid
    , id;
  id = p.player1.uid === uid ? 1
    : p.player2.uid === uid ? 2
    : p.player3.uid === uid ? 3
    : p.player4.uid === uid ? 4
    : null;
  return id ? "player" + id : id;
};

GameSchema.methods._getCardsAllowed = function (pid) {
  var cards = this.round.cards[pid]
    , turn = this.round.turn
    , shuffledTid = this.players[this.round.shuffledPlayer].tid
    , playerTid = this.players[pid].tid
    , sortedCards;

  if (turn.currentPid !== pid) {
    return [];
  }

  sortedCards = deck.sortedCards(cards, turn[turn.firstPid]);
  if (this.round.number === 1) {
    if (this.turn.number === 1) {
      return deck.cardIdFor(deck.Suite.Diamonds, deck.Types.Ace);
    }
    return sortedCards.nonTrumps.length ? sortedCards.nonTrumps : sortedCards.trumps;
  } else {
    return playerTid === shuffledTid
      ? (sortedCards.nonTrumps.length ? sortedCards.nonTrumps : sortedCards.trumps)
      : cards;
  }
};


//TODO: test findActiveGame
GameSchema.statics.findByUser = function (user, callback, limit, active) {
  var uid = user.uid
    , uidCondition = [
      { "players.player1.uid": uid },
      { "players.player2.uid": uid },
      { "players.player3.uid": uid },
      { "players.player4.uid": uid }
    ];
  this.find()
    //TODO: define flag usage
//    .where("meta.active").equals(!!active)
    .or(uidCondition)
    .limit(limit || 10)
    .sort("+meta.created")
    .exec(function (error, games) {
      callback(games);
    });
};

module.exports = {

  model: function (db) {
    return db.model("Game", GameSchema);
  },

  utils: {
    prevPid : prevPid,
    nextPid : nextPid,
    otherTid: otherTid
  }
};
