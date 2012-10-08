define([
  "jquery",
  "underscore",
  "view/base",
  "model/game",
  "util/dispatcher",
  "util/socket"
], function ($, _, BaseView, Game, dispatcher, socket) {

  "use strict";

  var suites = {
    's': '♠',
    'h': '♥',
    'd': '♦',
    'c': '♣'
  };

  function getCardData(cardId) {
    if (!cardId) {
      return null;
    }
    var parts = cardId.split("-")
      , suite = parts[0]
      , value = parts[1];
    return {
      id     : cardId,
      name   : value + ' ' + suites[suite],
      suite  : suite
    };
  }


  var View = BaseView.extend({

    tpl: "desk",

    model: new Game(),

    events: {
      'click .desk-card-element': "doTurn"
    },

    doTurn: function (e) {
      e.preventDefault();
      var id = $(e.currentTarget).data("id");
      socket.emit("game:turn", {cid: id});
      return false;
    },

    getData: function () {
      var data = this.model.toJSON()
        , cardsOnHands = data.cards
        , cardsAllowed = data.cardsAllowed
        , cards = [];

      // on hands cards
      _.each(cardsOnHands, function (id) {
        var card = getCardData(id);
        card.allowed = _.contains(cardsAllowed, id);
        cards.push(card);
      });
      data.cards = cards;

      // turn cards
      data.turn.player1 = getCardData(data.turn.player1);
      data.turn.player2 = getCardData(data.turn.player2);
      data.turn.player3 = getCardData(data.turn.player3);
      data.turn.player4 = getCardData(data.turn.player4);

      return data;
    }

  });

  return new View();
});
