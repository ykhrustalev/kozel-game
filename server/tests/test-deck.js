var deck = require("../deck"),
  _ = require("underscore")._;

module.exports = {

  testSplit: function (test) {
    var split = deck.split(4);
    test.equals(split.length, 4);
    test.equals(_.intersection(split[0], split[1], split[2], split[3]).length, 0);
    test.done();
  }

};