var _ = require('underscore')._;

var suites , types, orderTable;

suites = {
  Spades  : {id: 's'},
  Hearts  : {id: 'h'},
  Diamonds: {id: 'd'},
  Clubs   : {id: 'c'}
};

types = {
  Queen: {id: 'Q', score: 3},
  Jack : {id: 'J', score: 2},
  King : {id: 'K', score: 4},
  Ace  : {id: 'A', score: 11},
  T10  : {id: '10', score: 10},
  T9   : {id: '9', score: 0},
  T8   : {id: '8', score: 0},
  T7   : {id: '7', score: 0}
};

orderTable = {

  trumpTypes: [
    types.T7.id,
    types.Queen.id,
    types.Jack.id,
    types.Ace.id,
    types.T10.id,
    types.King.id,
    types.T9.id,
    types.T8.id
  ],

  trumpSuites: [
    suites.Clubs.id,
    suites.Spades.id,
    suites.Hearts.id,
    suites.Diamonds.id
  ],

  nonTrumpsTypes: [
    types.Ace.id,
    types.T10.id,
    types.King.id,
    types.T9.id,
    types.T8.id,
    types.T7.id
  ]
};

var Deck = function () {

  var self = this;

  self._initialDeck = {};

  // create initial deck
  _.each(suites, function (suite) {
    _.each(types, function (type) {
      var id = self.cardIdFor(suite, type);
      self._initialDeck[id] = {
        id     : id,
        suite  : suite,
        type   : type,
        score  : type.score,
        isTrump: suite.id === suites.Clubs.id
          || type.id === types.Queen.id
          || type.id === types.Jack.id
      };
    });
  });
};

Deck.prototype = {

  getScore: function () {
    var score = 0
      , deck = this._initialDeck;
    for (var i = 0, len = arguments.length; i < len; i++) {
      score += deck[arguments[i]].score
    }
    return score;
  },

  // TODO: unit test
  getCard : function (cardId) {
    return _.clone(this._initialDeck[cardId]);
  },

  Suites: suites,

  Types     : types,

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
  //TODO: rename to cidFor
  cardIdFor: function (suite, type) {
    return suite.id + '-' + type.id;
  },
  cidFor: function (suite, type) {
    return suite.id + '-' + type.id;
  },


  beats: function (attackCid, defendCid) {
    var a = this.getCard(attackCid)
      , d = this.getCard(defendCid)
      , nt = orderTable.nonTrumpsTypes
      , tt = orderTable.trumpTypes
      , ts = orderTable.trumpSuites
      , ttA = tt.indexOf(a.type.id)
      , ttD = tt.indexOf(d.type.id)
      , ntA = nt.indexOf(a.type.id)
      , ntD = nt.indexOf(d.type.id)
      , tsA = ts.indexOf(a.suite.id)
      , tsD = ts.indexOf(d.suite.id);

    if (a.isTrump && d.isTrump) {
      if (ttA === ttD) {
        return tsA < tsD;
      } else {
        return ttA < ttD;
      }
    } else if (a.isTrump && !d.isTrump) {
      return true;
    } else if (!a.isTrump && d.isTrump) {
      return false;
    } else if (!a.isTrump && !d.isTrump) {
      if (tsA !== tsD) {
        return false;
      } else {
        return ntA < ntD;
      }
    } else {
      var message = "could not compare: a: " + attackCid + " d: " + defendCid;
      console.warn(message);
      throw new Error(message);
    }
  },

  isTrump    : function (cardId) {
    var parts = cardId.split("-");
    return parts[0] === this.Suites.Clubs.id
      || parts[1] === this.Types.Queen.id
      || parts[1] === this.Types.Jack.id;
  },

  // TODO: unit test, move to derived class
  sortedCards: function (cards, startCardId) {
    var self = this,
      startCard = startCardId ? self.getCard(startCardId) : null
      , sorted = {
        suite    : [],
        trumps   : [],
        nonTrumps: []
      };

    _.each(cards, function (cardId) {
      if (self.isTrump(cardId)) {
        sorted.trumps.push(cardId);
      } else {
        sorted.nonTrumps.push(cardId);
        if (startCardId && self.getCard(cardId).suite === startCard.suite) {
          sorted.suite.push(cardId);
        }
      }
    });

    return sorted;
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
