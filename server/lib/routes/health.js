var deck = require("../service/deck")
  , _ = require("underscore")._
  , cards = [];

_.each(deck.suites, function (suite) {
  var row = [];
  _.each(deck.types, function (type) {
    row.push({
      id   : deck.cidFor(suite, type),
      suite: suite.id
    });
  });
  cards.push({
    row  : row,
    suite: suite
  });
});

module.exports = function (req, res) {
  res.render('health', {
    version: "0.0.1",
    process: process,
    cards  : cards
  });
};
