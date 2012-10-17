var deck = require("../deck"),
  _ = require("underscore")._;

module.exports = {

  shuffle: function (test) {
    var split = deck.shuffle(4);
    test.equals(split.length, 4);
    test.equals(_.intersection(split[0], split[1], split[2], split[3]).length, 0);
    test.ok(Array.isArray(split[0]));
    test.equals(split[0].length, 8);
    test.equals(split[1].length, 8);
    test.equals(split[2].length, 8);
    test.equals(split[3].length, 8);
    test.equals(typeof(split[0][0]), "string");
    test.done();
  },

  shuffle2: function (test) {
    var splits = [];
    for (var i = 0; i < 5; i++) {
      splits.push(deck.shuffle(1).join(","));
    }
    test.equals(splits.length, _.unique(splits).length);
    test.done();
  },

  getScore: function (test) {
    var suites = deck.suites;

    function assertScore(type, score) {
      test.equals(deck.getScore(deck.cidFor(suites.Diamonds, type)), score);
      test.equals(deck.getScore(deck.cidFor(suites.Spades, type)), score);
      test.equals(deck.getScore(deck.cidFor(suites.Hearts, type)), score);
      test.equals(deck.getScore(deck.cidFor(suites.Clubs, type)), score);
    }

    test.expect(32);

    assertScore(deck.types.Ace, 11);
    assertScore(deck.types.T10, 10);
    assertScore(deck.types.King, 4);
    assertScore(deck.types.Queen, 3);
    assertScore(deck.types.Jack, 2);
    assertScore(deck.types.T9, 0);
    assertScore(deck.types.T8, 0);
    assertScore(deck.types.T7, 0);

    test.done();
  },

  cidFor: function (test) {
    test.equals(deck.cidFor(deck.suites.Diamonds, deck.types.Ace), "d-A");
    test.done();
  },

  // TODO: add more testing
  beats: function (test) {

    var spades = deck.suites.Spades
      , hearts = deck.suites.Hearts
      , diamonds = deck.suites.Diamonds
      , clubs = deck.suites.Clubs
      , Q = deck.types.Queen
      , J = deck.types.Jack
      , K = deck.types.King
      , A = deck.types.Ace
      , T10 = deck.types.T10
      , T9 = deck.types.T9
      , T8 = deck.types.T8
      , T7 = deck.types.T7;

    function _beats(s1, t1, s2, t2, ok) {
      var result = deck.beats(deck.cidFor(s1, t1), deck.cidFor(s2, t2));
      test.ok(ok ? result : !result, s1.id + "-" + t1.id + " should " + (ok ? "" : " not") + " beat " + s2.id + "-" + t2.id);
    }

    function beats(s1, t1, s2, t2) {
      _beats(s1, t1, s2, t2, true);
    }

    function beatsNot(s1, t1, s2, t2) {
      _beats(s1, t1, s2, t2, false);
    }

    beatsNot(diamonds, A, diamonds, Q);
    beatsNot(diamonds, A, diamonds, J);
    beats(diamonds, A, diamonds, T10);
    beats(diamonds, A, diamonds, K);
    beats(diamonds, A, diamonds, T9);
    beats(diamonds, A, diamonds, T8);
    beats(diamonds, A, diamonds, T7);

    beatsNot(diamonds, A, clubs, T7);
    beatsNot(diamonds, A, hearts, T10);
    beatsNot(diamonds, A, spades, T10);

    beatsNot(diamonds, T7, diamonds, A);
    beatsNot(diamonds, T7, diamonds, T10);
    beatsNot(diamonds, T7, diamonds, K);
    beatsNot(diamonds, T7, diamonds, T9);
    beatsNot(diamonds, T7, diamonds, T8);
    beatsNot(diamonds, T7, clubs, T7);

    beats(diamonds, J, diamonds, A);
    beats(diamonds, J, spades, A);
    beats(diamonds, J, hearts, A);
    beats(diamonds, J, clubs, A);
    beats(diamonds, J, clubs, T10);
    beats(diamonds, J, clubs, K);
    beats(diamonds, J, clubs, T9);
    beats(diamonds, J, clubs, T8);
    beatsNot(diamonds, J, clubs, T7);
    beatsNot(diamonds, J, clubs, Q);

    beats(clubs, Q, spades, Q);
    beats(clubs, Q, hearts, Q);
    beats(clubs, Q, diamonds, Q);

    beatsNot(spades, Q, clubs, Q);
    beats(spades, Q, hearts, Q);
    beats(spades, Q, diamonds, Q);
    beats(clubs, Q, clubs, J);

    test.done();
  },

  // TODO: add more testing
  sort: function (test) {

    var s = deck.suites
      , t = deck.types
      , cid = deck.cidFor
      , c7 = cid(s.Clubs, t.T7)
      , dJ = cid(s.Diamonds, t.Jack)
      , sJ = cid(s.Spades, t.Jack)
      , d10 = cid(s.Diamonds, t.T10)
      , d9 = cid(s.Diamonds, t.T9)
      , h10 = cid(s.Hearts, t.T10)
      , h9 = cid(s.Hearts, t.T9)
      , s10 = cid(s.Spades, t.T10)
      , s9 = cid(s.Spades, t.T9);

    var src = [d10, d9, dJ, c7, h9, h10, s9, s10, sJ]
      , expected = [c7, sJ, dJ, s10, s9, h10, h9, d10, d9];
    var sorted = deck.sort(src);

    test.equals(src.length, sorted.length);
    console.log(src);
    console.log(sorted);
    console.log(expected);
    for (var i = 0, len = src.length; i< len; i++){
      test.equals(sorted.shift(), expected.shift());
    }
    test.done()
  },

  group: function (test) {

    var s = deck.suites
      , t = deck.types
      , cid = deck.cidFor;

    var d10 = cid(s.Diamonds, t.T10);
    var d9 = cid(s.Diamonds, t.T9);
    var dJ = cid(s.Diamonds, t.Jack);
    var c7 = cid(s.Clubs, t.T7);
    var h10 = cid(s.Hearts, t.T10);
    var sorted = deck.group([d10, d9, dJ, c7, h10], cid(s.Diamonds, t.Ace));

    test.equals(sorted.suite.length, 2);
    test.ok(_.contains(sorted.suite, d10));
    test.ok(_.contains(sorted.suite, d9));
    test.equals(sorted.trumps.length, 2);
    test.ok(_.contains(sorted.trumps, dJ));
    test.ok(_.contains(sorted.trumps, c7));
    test.equals(sorted.nonTrumps.length, 3);
    test.ok(_.contains(sorted.nonTrumps, d10));
    test.ok(_.contains(sorted.nonTrumps, d9));
    test.ok(_.contains(sorted.nonTrumps, h10));

    test.done();
  }
};