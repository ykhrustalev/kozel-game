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
      socket.emit("game:turn", {cardId: id});
      return false;
    },

    getData: function () {
      var data = this.model.toJSON()
        , cardsOnHands = data.player.cards
        , cardsAllowed = data.player.cardsAllowed
        , cards = []
        , turn = data.round.turn;

      // on hands cards
      _.each(cardsOnHands, function (id) {
        var card = getCardData(id);
        card.allowed = _.contains(cardsAllowed, id);
        cards.push(card);
      });
      data.player.cards = cards;

      // turn cards
      data.round.turn = {
        player1: getCardData(turn.player1),
        player2: getCardData(turn.player2),
        player3: getCardData(turn.player3),
        player4: getCardData(turn.player4)
      };

      return data;
    }

  });

  return new View();
});
