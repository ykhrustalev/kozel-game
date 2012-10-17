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

  function getCardData(cid) {
    if (!cid) {
      return null;
    }
    var parts = cid.split("-")
      , suite = parts[0]
      , value = parts[1];
    return {
      id   : cid,
      name : value + ' ' + suites[suite],
      suite: suite
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
      var target = $(e.currentTarget);
      var cid = target.data("id");
      if (this.isCardAllowed(cid)) {
        if (this.model.get("selected") === cid) {
          socket.emit("game:turn", {cid: cid});
        } else {
          this.model.set("selected", cid);
          this.$el.find(".selected").removeClass("selected");
          target.addClass("selected");
        }
      } else {
        this.$el.find(".note").html("Карта не разрешена");//TODO: need text?
      }
      return false;
    },

    isCardAllowed: function (cid) {
      return _.contains(this.model.get("cardsAllowed"), cid);
    },

    getData: function () {
      var data = this.model.toJSON()
        , cardsOnHands = data.cards
        , cardsAllowed = data.cardsAllowed
        , cards = [];

      if (cardsOnHands) {

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
      }

      return data;
    }

  });

  return new View();
});
