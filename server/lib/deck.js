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

  nonTrumpsTypes: [
    types.Ace.id,
    types.T10.id,
    types.King.id,
    types.T9.id,
    types.T8.id,
    types.T7.id
  ],

  trumps: [
    cidFor(suites.Clubs, types.T7),
    cidFor(suites.Clubs, types.Queen),
    cidFor(suites.Spades, types.Queen),
    cidFor(suites.Hearts, types.Queen),
    cidFor(suites.Diamonds, types.Queen),
    cidFor(suites.Clubs, types.Jack),
    cidFor(suites.Spades, types.Jack),
    cidFor(suites.Hearts, types.Jack),
    cidFor(suites.Diamonds, types.Jack),
    cidFor(suites.Clubs, types.Ace),
    cidFor(suites.Clubs, types.T10),
    cidFor(suites.Clubs, types.King),
    cidFor(suites.Clubs, types.T9),
    cidFor(suites.Clubs, types.T8)
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
      , twA = orderTable.trumps.indexOf(attackCid)
      , twD = orderTable.trumps.indexOf(defendCid)
      , ntA = nt.indexOf(a.type.id)
      , ntD = nt.indexOf(d.type.id);

    if (a.isTrump && d.isTrump) {
      return twA < twD;
    } else if (a.isTrump && !d.isTrump) {
      return true;
    } else if (!a.isTrump && d.isTrump) {
      return false;
    } else {
      if (a.suite.id !== d.suite.id) {
        return false;
      } else {
        return ntA < ntD;
      }
    }
  },

  sort: function (cids) {
    var groups = { trumps: [] };

    groups[suites.Spades.id] = [];
    groups[suites.Hearts.id] = [];
    groups[suites.Diamonds.id] = [];

    _.each(cids, function (cid) {
      var card = initialDeck[cid];
      if (card.isTrump) {
        groups.trumps.push(cid);
      } else {
        groups[card.suite.id].push(cid);
      }
    });

    return [].concat(
      _.sortBy(groups.trumps, function (cid) {
        return orderTable.trumps.indexOf(cid);
      }),
      _.sortBy(groups[suites.Spades.id], function (cid) {
        return orderTable.nonTrumpsTypes.indexOf(initialDeck[cid].type.id);
      }),
      _.sortBy(groups[suites.Hearts.id], function (cid) {
        return orderTable.nonTrumpsTypes.indexOf(initialDeck[cid].type.id);
      }),
      _.sortBy(groups[suites.Diamonds.id], function (cid) {
        return orderTable.nonTrumpsTypes.indexOf(initialDeck[cid].type.id);
      })
    );
  },

  group: function (cids, firstCid) {
    var firstCard = firstCid ? initialDeck[firstCid] : null
      , groups = {
        suite       : [],
        trumps      : [],
        nonTrumps   : [],
        isFirstTrump: firstCard ? firstCard.isTrump : null
      };

    _.each(cids, function (cid) {
      var card = initialDeck[cid];
      if (card.isTrump) {
        groups.trumps.push(cid);
      } else {
        groups.nonTrumps.push(cid);
        if (firstCard && card.suite.id === firstCard.suite.id) {
          groups.suite.push(cid);
        }
      }
    });

    return groups;
  }

};
