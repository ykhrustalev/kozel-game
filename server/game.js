var _ = require("underscore")._,
    deck = require("./deck"),
    config = require("./config"),
    mongoose = require("mongoose");

var Schema = mongoose.Schema;

var PlayerSchema = {
  uid   : String,
  teamId: Number, // 1|2
  name  : String
};

var GameSchema = new Schema({

  meta: {
    created     : { type: Date, default: Date.now },
    started     : Date,
    active      : { type: Boolean, default: false },
    playersCount: { type: Number, default: 0 },
    score       : {
      team1: { type: Number, default: 0 },
      team2: { type: Number, default: 0 }
    },
    hasEquals   : Boolean
  },

  players: {
    player1: PlayerSchema,
    player2: PlayerSchema,
    player3: PlayerSchema,
    player4: PlayerSchema
  },

  round: {
    created: { type: Date, default: Date.now },

    shufflePlayer: String,

    rate: { type: Number, default: 1},

    score: {
      team1: { type: Number, default: 0 },
      team2: { type: Number, default: 0 }
    },

    turn: {
      created      : { type: Date, default: Date.now },
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


GameSchema.methods.start = function () {

  if (this.meta.active) {
    console.error("game already started", this);
    throw new Error("game already started");
  }

  if (this.meta.playersCount!=4) {
    console.error("not enough players", this);
    throw new Error("not enough players");
  }

  this.meta.active = true;
  this.meta.started = new Date;

  this.newRound();
  var player = this.findPlayerByCard(deck.Suite.Diamonds, deck.Type.Ace);
  this.newTurn(player);

};

GameSchema.methods.newRound = function (rate) {

  var split = deck.split(4),
      round = this.round,
      cards = round.cards;

  cards.player1 = deck.getCardIds(split.shift());
  cards.player2 = deck.getCardIds(split.shift());
  cards.player3 = deck.getCardIds(split.shift());
  cards.player4 = deck.getCardIds(split.shift());

  if (rate) {
    round.rate = rate;
  }

};

GameSchema.methods.newTurn = function (firstPlayer) {

  var turn = this.round.turn;

  turn.created = new Date;
  turn.currentPlayer = firstPlayer;
  turn.player1 = "";
  turn.player2 = "";
  turn.player3 = "";
  turn.player4 = "";

};

GameSchema.methods.findPlayerByCard = function (suite, type) {

  var cardId = deck.cardIdFor(suite, type),
      cards = this.round.cards,
      playerId = cards.player1.indexOf(cardId) >= 0 ? 1
          : cards.player2.indexOf(cardId) >= 0 ? 2
          : cards.player3.indexOf(cardId) >= 0 ? 3
          : cards.player4.indexOf(cardId) >= 0 ? 4 : -1;

  if (playerId === -1) {
    console.error("unknown card", cardId, cards);
    throw new Error("unknown card");
  }

  return "player" + playerId;
};

GameSchema.methods.isReadyToStart = function () {
  return this.meta.playersCount == 4;
};

GameSchema.methods.isPlayerJoined = function (user) {
  var p = this.players,
      uid = user.uid;
  return p.player1.uid == uid
      || p.player2.uid == uid
      || p.player3.uid == uid
      || p.player4.uid == uid;
};

GameSchema.methods.addPlayer = function (user) {

  if (this.meta.playersCount >= 4 || this.isPlayerJoined(user)) {
    return false;
  }

  this.meta.playersCount += 1;

  this.players["player" + this.meta.playersCount] = {
    uid   : user.uid,
    teamId: (this.meta.playersCount % 2) ? 1 : 2,
    name  : user.first_name + ' ' + user.last_name
  };

  return true;
};

GameSchema.methods.exportForPlayer = function (profile) {

  var self = this,
      uid = profile.uid;

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

GameSchema.statics.new = function (user) {
  var game = new this;
  game.addPlayer(user);
  return game;
};

GameSchema.statics.findAvailableForJoin = function (callback) {
  this.find()
      .where('active').equals(true)
      .where('playersCount').lt(4)
      .limit(10)
      .sort('+created')
      .select('_id playersCount players created score')
      .exec(callback);
};

GameSchema.statics.findByUser = function (profile, callback) {
  this.find()
      .where('active').equals(true)
      .where('players.uid').in([profile.uid])
      .limit(10)
      .sort('+created')
      .exec(callback);
};

GameSchema.statics.join = function (gameId, profile, failCallback, successCallback) {

  var self = this;
  this.findByUser(profile, function (error, games) {

    // there another game assigned, should not happen
    if (games && games.length) {
      successCallback(games[0]);
      return;
    }

    self.findOne({"_id": gameId}, function (error, game) {

      // could not find game, or error
      if (error || !game) {
        failCallback();
        return
      }

      // already in game, should not happen
      if (game.isPlayerJoined(profile)) {
        successCallback(game);
        return;
      }

      // could not get in
      if (!game.addPlayer(profile)) {
        failCallback();
        return
      }

      // game ready to start, prepare data
      if (game.isReadyToStart()) {
        game.start();
      }

      game.save(function () {
        successCallback(game);
      })
    });

  });
};


module.exports = {
  model: function (db) {
    return db.model("Game", GameSchema);
  }
};
