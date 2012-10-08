var _ = require('underscore')._;

var Deck = function () {

  var self = this;

  self._initialDeck = {};

  // create initial deck
  _.each(self.Suites, function (suite) {
    _.each(self.Types, function (type) {
      var id = self.cardIdFor(suite, type);
      self._initialDeck[id] = {
        id   : id,
        suite: suite,
        type : type,
        score: type.score
      };
    });
  });
};

Deck.prototype = {

  //TODO: unit test
  getScore: function (cardId) {
    return this._initialDeck[cardId].score;
  },

  Suites: {
    Spades  : {id: 's'},
    Hearts  : {id: 'h'},
    Diamonds: {id: 'd'},
    Clubs   : {id: 'c'}
  },

  Types: {
    Queen: {id: 'Q', score: 3},
    Jack : {id: 'J', score: 2},
    King : {id: 'K', score: 4},
    Ace  : {id: 'A', score: 11},
    T10  : {id: '10', score: 10},
    T9   : {id: '9', score: 0},
    T8   : {id: '8', score: 0},
    T7   : {id: '7', score: 0}
  },

  // TODO: unit test
  _randomize: function (deck) {
    var i;
    deck = _.values(deck);
    for (i = Math.floor(Math.random() * 400 + 3); i > 0; i = -1) {
      deck = _.shuffle(deck);
    }
    return deck;
  },

  /**
   * Creates id for card by its suite and type.
   *
   * @see type, suites
   * @param {String} suite
   * @param {String} type
   * @return {String}
   */
  cardIdFor: function (suite, type) {
    return suite.id + '-' + type.id;
  },

  /**
   * Shuffle deck for specified number of parts.
   * @param {Number} count
   * @return {Array}
   */
  shuffle: function (count) {
    var deck, groups, parts = [];

    deck = this._randomize(_.clone(this._initialDeck));

    groups = _.groupBy(deck, function (value, index) {
      return index % count;
    });

    _.each(_.values(groups), function (group) {
      var split = _.map(group, function (value) {
        return value.id;
      });
      parts.push(split);
    });

    return parts;
  }

};

module.exports = new Deck();
