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

gameSchema.methods.shuffle = function () {

  var split = Deck.split(4);

  var getCardIds = Deck.getCardIds;

  this.hands = {
    player1: getCardIds(split[0]),
    player2: getCardIds(split[1]),
    player3: getCardIds(split[2]),
    player4: getCardIds(split[3])
  };
};

var Game = db.model('Game', gameSchema);

module.exports = Game;
