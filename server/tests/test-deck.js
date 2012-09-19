var deck = require("../deck"),
    _ = require("underscore")._;

module.exports = {
//  setUp   : function (callback) {
//    this.foo = 'bar';
//    callback();
//  },
//  tearDown: function (callback) {
//    clean up
//    callback();
//  },

  testSplit: function (test) {
    var split = deck.split(4);
    test.equals(split.length, 4);
    test.equals(_.intersection(split[0], split[1], split[2], split[3]).length, 0);
    test.done();
  }
};