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

  beats : function (test) {

    var s = deck.suites.Spades
      , h = deck.suites.Hearts
      , d = deck.suites.Diamonds
      , c = deck.suites.Clubs
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

    beatsNot(d, A, d, Q);
    beatsNot(d, A, d, J);
    beats(d, A, d, T10);
    beats(d, A, d, K);
    beats(d, A, d, T9);
    beats(d, A, d, T8);
    beats(d, A, d, T7);

    beatsNot(d, A, c, T7);
    beatsNot(d, A, h, T10);
    beatsNot(d, A, s, A);

    beatsNot(d, T7, d, A);
    beatsNot(d, T7, d, T10);
    beatsNot(d, T7, d, K);
    beatsNot(d, T7, d, T9);
    beatsNot(d, T7, d, T8);
    beatsNot(d, T7, c, T7);

    beats(d, J, d, A);
    beats(d, J, s, A);
    beats(d, J, h, A);
    beats(d, J, c, A);
    beats(d, J, c, T10);
    beats(d, J, c, K);
    beats(d, J, c, T9);
    beats(d, J, c, T8);
    beatsNot(d, J, c, T7);
    beatsNot(d, J, c, Q);
    beatsNot(d, J, s, J);

    beats(c, Q, s, Q);
    beats(c, Q, h, Q);
    beats(c, Q, d, Q);
    beats(c, Q, c, J);
    beats(c, Q, c, T8);
    beatsNot(c, Q, c, T7);

    beatsNot(s, Q, c, Q);
    beats(s, Q, h, Q);
    beats(s, Q, d, Q);
    beats(c, Q, c, J);

    test.done();
  },

  sort: function (test) {

    var s = deck.suites
      , t = deck.types
      , cid = deck.cidFor
      , c7 = cid(s.Clubs, t.T7)
      , dJ = cid(s.Diamonds, t.Jack)
      , sJ = cid(s.Spades, t.Jack)
      , d10 = cid(s.Diamonds, t.T10)
      , dK = cid(s.Diamonds, t.King)
      , d9 = cid(s.Diamonds, t.T9)
      , h10 = cid(s.Hearts, t.T10)
      , h9 = cid(s.Hearts, t.T9)
      , s10 = cid(s.Spades, t.T10)
      , sK = cid(s.Spades, t.King)
      , s9 = cid(s.Spades, t.T9);

    var src = [d10, d9, dJ, sK, c7, h9, h10, s9, s10, sJ, dK]
      , expected = [c7, sJ, dJ, s10, sK, s9, h10, h9, d10, dK, d9]
      , sorted = deck.sort(src);

    test.equals(src.length, sorted.length);
    for (var i = 0, len = src.length; i < len; i++) {
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