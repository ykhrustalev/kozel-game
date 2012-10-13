var deck = require("../deck"),
  _ = require("underscore")._;

module.exports = {

  testShuffle: function (test) {
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

  testCardIdFor: function (test) {
    test.equals(deck.cardIdFor(deck.Suites.Diamonds, deck.Types.Ace), "d-A");
    test.done();
  },

  beats: function (test) {
    //TODO: complete me
    // nontrumps:
    // - sequence


    var spades = deck.Suites.Spades
      , hearts = deck.Suites.Hearts
      , diamonds = deck.Suites.Diamonds
      , clubs = deck.Suites.Clubs
      , Q = deck.Types.Queen
      , J = deck.Types.Jack
      , K = deck.Types.King
      , A = deck.Types.Ace
      , T10 = deck.Types.T10
      , T9 = deck.Types.T9
      , T8 = deck.Types.T8
      , T7 = deck.Types.T7;

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
  }
};