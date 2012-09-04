var _ = require('underscore')._;


var mongoose = require('mongoose');
var db = mongoose.createConnection('localhost', 'test');

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
  console.log("open complete")
});

var Schema = mongoose.Schema;

var gameSchema = new Schema({

  crated: { type: Date, default: Date.now },
  finished: Date,
  active: Boolean,

  players: [
    {
      id: String,
      name: String,
      date: Date,
      team: String
    }
  ],

  score: {
    team1: Number,
    team2: Number
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

gameSchema.statics.new = function () {

  var split = Deck.split(4);
  var getIds = function (collection) {
    return _.map(collection, function (value) {
      return value.id;
    });
  };

  var game = new Game({
    active: true,
    score: {team1: 0, team2: 0},
    hands: {
      player1: getIds(split[0]),
      player2: getIds(split[1]),
      player3: getIds(split[2]),
      player4: getIds(split[3])
    }
  });

  return game;
};

var Game = db.model('Game', gameSchema);

module.exports = Game;
