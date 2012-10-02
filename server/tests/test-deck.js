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
  }
};