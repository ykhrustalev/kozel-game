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

  this.assignToTeam(this.players.length - 1);

  return true;
};

gameSchema.methods.assignToTeam = function (id) {
  var teams = this.teams,
      team = (teams.team0.length <= teams.team1.length)
          ? teams.team0
          : teams.team1;
  team.push(id);
};

gameSchema.methods.exportForPlayer = function (uid) {

  var playerId;
  for (var i = 0, len = this.players.length; i < len; i++) {
    if (this.players[i].uid == uid) {
      playerId = i;
      break;
    }
  }

  var teamId = (this.teams.team1.indexOf(playerId) >= 0) ? 0 : 1;

  var players = [];
  if (teamId == 0) {

  }


  return {
    active  : this.active,
    created : this.created,
    finished: this.finished,
    playerId: playerId,
    teamId  : teamId
  };
};

gameSchema.statics.create = function (profile, callback) {
  var game = new this;
  game.addPlayer(profile);
  game.save(callback);
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

gameSchema.statics.join = function (gameId, profile, joinCallback, startCallback) {

  this.findOne({"_id": gameId}, function (error, game) {
    game.addPlayer(profile);
    if (game.isReadyToStart()) {
      game.start();
      game.save(function () {
        startCallback(game);
      })
    } else {
      game.save(joinCallback);
    }
  });
};

var Game = db.model('Game', gameSchema);

module.exports = Game;
