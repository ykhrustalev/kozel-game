var _ = require('underscore')._;

var suites
  , types
  , orderTable
  , initialDeck = {};

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

function cidFor(suite, type) {
  return suite.id + '-' + type.id;
}

function randomize(deck) {
  var i;
  deck = _.values(deck);
  for (i = Math.floor(Math.random() * 400 + 10); i > 0; i = -1) {
    deck = _.shuffle(deck);
  }
  return deck;
}

function isTrump(suite, type) {
  return suite.id === suites.Clubs.id
    || type.id === types.Queen.id
    || type.id === types.Jack.id;
}

// create initial deck
_.each(suites, function (suite) {
  _.each(types, function (type) {
    var id = cidFor(suite, type);
    initialDeck[id] = {
      id     : id,
      suite  : suite,
      type   : type,
      score  : type.score,
      isTrump: isTrump(suite, type)
    };
  });
});


module.exports = {

  suites: suites,

  types: types,

  /**
   * Shuffle deck for specified number of parts.
   * @param {Number} count
   * @return {Array}
   */
  shuffle: function (count) {
    var deck, groups, parts = [];

    deck = randomize(_.clone(initialDeck));

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
  },

  getScore: function (cid) {
    return initialDeck[cid].score;
  },

  cidFor: function (suite, type) {
    return suite.id + '-' + type.id;
  },

  beats: function (attackCid, defendCid) {
    var a = initialDeck[attackCid]
      , d = initialDeck[defendCid]
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

  sortedCards: function (cids, firstCid) {
    var firstCard = firstCid ? initialDeck[firstCid] : null
      , sorted = {
        suite    : [],
        trumps   : [],
        nonTrumps: []
      };

    _.each(cids, function (cid) {
      var card = initialDeck[cid];
      if (card.isTrump) {
        sorted.trumps.push(cid);
      } else {
        sorted.nonTrumps.push(cid);
        if (firstCard && card.suite.id === firstCard.suite.id) {
          sorted.suite.push(cid);
        }
      }
    });

    return sorted;
  }

};
