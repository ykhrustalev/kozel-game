var _ = require('underscore')._;

var Suite = {
  Spades: {id: 's', name: 'Пики'},
  Hearts: {id: 'h', name: 'Черви'},
  Diamonds: {id: 'd', name: 'Бубни'},
  Clubs: {id: 'c', name: 'Трефы'}
};

var Type = {
  Queen: {id: 'Q', score: 3, name: 'Дама'},
  Jack: {id: 'J', score: 2, name: 'Валет'},
  King: {id: 'K', score: 4, name: 'Король'},
  Ace: {id: 'A', score: 11, name: 'Туз'},
  T10: {id: '10', score: 10, name: '10'},
  T9: {id: '9', score: 0, name: '9'},
  T8: {id: '8', score: 0, name: '8'},
  T7: {id: '7', score: 0, name: '7'}
};

//
var initDeck = function () {
  var deck = {};
  _.each(Suite, function (suite) {
    _.each(Type, function (type) {
      var id = suite.id + '-' + type.id;
      deck[id] = {id: id, suite: suite, type: type};
    });
  });
  return deck;
};


var Deck = {

  Suite: Suite,

  Type: Type,

  Definition: initDeck(),

  shuffle: function () {
    var i = Math.floor(Math.random() * 400 + 3);
    var deck = _.values(Deck.Definition) ;
    for (; i > 0; i--) {
      deck = _.shuffle(deck);
    }
    return deck;
  },

  split: function(times, deck) {
    deck = deck || this.shuffle();
    var grouped = _.groupBy(deck, function(value, index){
      return index % times;
    });
    return _.values(grouped);
  }
};

module.exports = Deck;
