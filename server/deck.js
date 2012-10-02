var _ = require('underscore')._;

var Deck = function () {

  var self = this;

  self._initialDeck = {};

  // create initial deck
  _.each(self.Suites, function (suite) {
    _.each(self.Types, function (type) {
      var id = self.cardIdFor(suite, type);
      self._initialDeck[id] = {id: id, suite: suite, type: type};
    });
  });
};

Deck.prototype = {

  // TODO: do we need to keep names of the types
  Suites: {
    Spades  : {id: 's', name: 'Пики'},
    Hearts  : {id: 'h', name: 'Черви'},
    Diamonds: {id: 'd', name: 'Бубни'},
    Clubs   : {id: 'c', name: 'Трефы'}
  },

  Types: {
    Queen: {id: 'Q', score: 3, name: 'Дама'},
    Jack : {id: 'J', score: 2, name: 'Валет'},
    King : {id: 'K', score: 4, name: 'Король'},
    Ace  : {id: 'A', score: 11, name: 'Туз'},
    T10  : {id: '10', score: 10, name: '10'},
    T9   : {id: '9', score: 0, name: '9'},
    T8   : {id: '8', score: 0, name: '8'},
    T7   : {id: '7', score: 0, name: '7'}
  },

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

    //TODO: clone might be over engineering here
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
