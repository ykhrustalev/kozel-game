var libpath = process.env["APP_COV"] ? '../lib-cov' : '../lib';
var should = require("should");
var deck = require(libpath + "/deck"),
  _ = require("underscore")._;


describe("deck", function () {
  describe("#shuffle()", function () {
    it("should shuffle unique cards", function (done) {
      var split = deck.shuffle(4);

      split.should.have.length(4);
      split[0].should.have.length(8);
      split[1].should.have.length(8);
      split[2].should.have.length(8);
      split[3].should.have.length(8);
      split[0][0].should.be.a("string");
      split[0].should.not.include(split[1], split[2], split[3]);
      split[1].should.not.include(split[2], split[3], split[0]);
      split[2].should.not.include(split[3], split[0], split[1]);
      split[3].should.not.include(split[0], split[1], split[2]);

      done();
    });

    it("should shuffle without repeats in 40 turns", function (done) {

      var splits = [];
      for (var i = 0; i < 40; i++) {
        splits.push(deck.shuffle(1).join(","));
      }
      splits.should.have.length(_.unique(splits).length);
      done();
    });

  });

  describe("#getScore()", function () {
    it("should provide correct value", function (done) {

      var suites = deck.suites;

      function assertScore(type, score) {
        deck.getScore(deck.cidFor(suites.Diamonds, type)).should.equal(score);
        deck.getScore(deck.cidFor(suites.Spades, type)).should.equal(score);
        deck.getScore(deck.cidFor(suites.Hearts, type)).should.equal(score);
        deck.getScore(deck.cidFor(suites.Clubs, type)).should.equal(score);
      }

      assertScore(deck.types.Ace, 11);
      assertScore(deck.types.T10, 10);
      assertScore(deck.types.King, 4);
      assertScore(deck.types.Queen, 3);
      assertScore(deck.types.Jack, 2);
      assertScore(deck.types.T9, 0);
      assertScore(deck.types.T8, 0);
      assertScore(deck.types.T7, 0);

      done();
    });
  });

  describe("#getCid()", function () {
    it("should return correct id", function (done) {
      deck.cidFor(deck.suites.Diamonds, deck.types.Ace).should.equal("d-A");
      done();
    });
  });


  describe("#beats()", function () {


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
      should.exist(result);
//      test.ok(ok ? result : !result, s1.id + "-" + t1.id + " should " + (ok ? "" : " not") + " beat " + s2.id + "-" + t2.id);
    }

    function beats(s1, t1, s2, t2) {
      _beats(s1, t1, s2, t2, true);
    }

    function beatsNot(s1, t1, s2, t2) {
      _beats(s1, t1, s2, t2, false);
    }

    it("should handle cards order correctly", function (done) {

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

      done();
    });

  });

  describe("#sort()", function () {
    it("should provide correct order for given range", function (done) {

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

      src.should.have.length(sorted.length);
      for (var i = 0, len = src.length; i < len; i++) {
        sorted.shift().should.equal(expected.shift());
      }

      done();
    });
  });

  describe("#group()", function () {
    it("should work correctly", function (done) {

      var s = deck.suites
        , t = deck.types
        , cid = deck.cidFor
        , d10 = cid(s.Diamonds, t.T10)
        , d9 = cid(s.Diamonds, t.T9)
        , dJ = cid(s.Diamonds, t.Jack)
        , c7 = cid(s.Clubs, t.T7)
        , h10 = cid(s.Hearts, t.T10);

      var sorted = deck.group([d10, d9, dJ, c7, h10], cid(s.Diamonds, t.Ace));

      sorted.suite.should.have.length(2);
      sorted.suite.should.include(d10);
      sorted.suite.should.include(d9);
      sorted.trumps.should.have.length(2);
      sorted.trumps.should.include(dJ);
      sorted.trumps.should.include(c7);
      sorted.nonTrumps.should.have.length(3);
      sorted.nonTrumps.should.include(d10);
      sorted.nonTrumps.should.include(d9);
      sorted.nonTrumps.should.include(h10);

      done();

    });
  });

});
