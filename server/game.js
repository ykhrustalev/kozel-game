var _ = require("underscore")._,
    Deck = require("./deck"),
    config = require("./config"),
    mongoose = require("mongoose"),
    db = mongoose.createConnection(config.db.host, config.db.name);

db.on('error', console.error.bind(console, 'connection error:'));

var Schema = mongoose.Schema;

var gameSchema = new Schema({

  active  : { type: Boolean, default: true },
  created : { type: Date, default: Date.now },
  finished: Date,

  playersCount: {type: Number, default: 0},

  players: [
    {
      uid : String,
      name: String
    }
  ],

  teams: {
    team0: [Number],
    team1: [Number]
  },

  score: {
    team0: {type: Number, default: 0},
    team1: {type: Number, default: 0}
  },

  turn: [String],

  playerTurn: Number,

  hands: [
    {
      player: String,
      cards : [String]
    }
  ],

  takes: [
    {
      date : { type: Date, default: Date.now },
      cards: [String],
      value: Number,
      owner: String
    }
  ]
});


gameSchema.methods.start = function () {

  var split = Deck.split(4);

  var game = this;
  game.players.forEach(function (player) {
    game.hands.push({
      player: player.id,
      cards : Deck.getCardIds(split.shift())
    });
  })
};

gameSchema.methods.isReadyToStart = function () {
  return this.playersCount == 4;
};

gameSchema.methods.isPlayerJoined = function (profile) {
  var isSigned = false;
  this.players.forEach(function (player) {
    if (player.id == profile.uid) {
//      isSigned = true;
    }
  });
  return isSigned;
};

gameSchema.methods.addPlayer = function (profile) {

  if (this.playersCount >= 4 || this.isPlayerJoined(profile)) {
    return false;
  }

  this.playersCount += 1;

  this.players.push({
    uid : profile.uid,
    name: profile.first_name + ' ' + profile.last_name
  });

  this.assignUserToTeam(this.players.length - 1);

  return true;
};

gameSchema.methods.assignUserToTeam = function (uid) {
  var teams = this.teams,
      team = (teams.team0.length <= teams.team1.length)
          ? teams.team0
          : teams.team1;
  team.push(uid);
};

gameSchema.methods.exportForPlayer = function (uid) {

  var self = this;

  var playerId;
  for (var i = 0, len = this.players.length; i < len; i++) {
    if (this.players[i].uid == uid) {
      playerId = i;
      break;
    }
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
    turn   : turn
  };
};

gameSchema.statics.create = function (profile, callback) {
  var game = new this;
  game.addPlayer(profile);
  game.save(function(){
    callback(game);
  });
};

gameSchema.statics.findAvailableForJoin = function (callback) {
  this.find()
      .where('active').equals(true)
      .where('playersCount').lt(4)
      .limit(10)
      .sort('+created')
      .select('_id playersCount players created score')
      .exec(callback);
};

gameSchema.statics.findByUser = function (profile, callback) {
  this.find()
      .where('active').equals(true)
      .where('players.uid').in([profile.uid])
      .limit(10)
      .sort('+created')
//      .select('_id playersCount players created score')
      .exec(callback);
};

gameSchema.statics.join = function (gameId, profile, failCallback, successCallback) {

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

var Game = db.model('Game', gameSchema);

module.exports = Game;
