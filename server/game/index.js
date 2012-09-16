var _ = require('underscore')._;


var mongoose = require('mongoose');
var db = mongoose.createConnection('localhost', 'kozel-dev');

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
  console.log("open complete")
});

var Schema = mongoose.Schema;

var gameSchema = new Schema({

  created: { type: Date, default: Date.now },
  finished: Date,
  active: { type: Boolean, default: true },

  playersCount: {type: Number, default: 0},

  players: [
    {
      id: String,
      name: String,
      date: Date,
      team: String
    }
  ],

  score: {
    team1: { type: Number, default: 0 },
    team2: { type: Number, default: 0 }
  },

  hands: {
    player1: [String],
    player2: [String],
    player3: [String],
    player4: [String]
  },

//  takes: [
//    {
//      date: Date,
//      cards: [[String]],
//      score: Number
//    }
//  ]
});


var Deck = require('./deck');

gameSchema.methods.start = function () {

  var split = Deck.split(4);

  var getCardIds = Deck.getCardIds;

  this.hands = {
    player1: getCardIds(split[0]),
    player2: getCardIds(split[1]),
    player3: getCardIds(split[2]),
    player4: getCardIds(split[3])
  };
};

gameSchema.methods.addPlayer = function (profile) {
  if (this.players.length >= 4) {
    return false;
  }

  var isSigned = false;
  this.players.forEach(function(player){
    if (player.id == profile.uid) {
      isSigned = true;
    }
  });

  if (isSigned) {
    return false;
  }

  this.players.push({
    id: profile.uid,
    name: profile.first_name +' '+profile.last_name,
    date: new Date,
    team: 0
  });
  this.playersCount += 1;

  return  true;
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

gameSchema.statics.join = function (gameId, profile, callback) {

  this.findOne({"_id": gameId}, function (error, game) {
    game.addPlayer(profile);
    game.save();

//    this.update({players:players}, {}, callback);
  });
};

var Game = db.model('Game', gameSchema);

module.exports = Game;
