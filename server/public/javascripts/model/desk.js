define([
  "underscore",
  "backbone",
  "util/socket",
  "util/dispatcher"
], function (_, Backbone, socket, dispatcher) {

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

  return Backbone.Model.extend({

    idAttribute: "_id",

    initialize: function () {

      var self = this;

      socket.on("game", function (data) {
        self.handleCallback(data);
      });
    },

    handleCallback: function (data) {
      var self = this;
      switch (data.status) {
        case "created":
        case "current":
          this.set(data.object);
          dispatcher.trigger("desk:change", "init");
          break;

        case "userjoined":
        case "userleft":
        case "started":
        case "turned":
          this.set(data.object);
          dispatcher.trigger("desk:change", "update");
          break;

        case "newTurn":
        case "newRound":
        case "queenCaught":
          setTimeout(function () {
            self.set(data.object);
            dispatcher.trigger("desk:change", "update");
          }, 2000);
          break;

        case "gameEnd":
          setTimeout(function () {
            self.set(data.object);
            dispatcher.trigger("desk:change", "update");
            setTimeout(function () {
              dispatcher.trigger("desk:change", "remove");
            }, 2000);
          }, 2000);
          break;
      }
    },

    leave: function () {
      socket.emit("game:leave");
      dispatcher.trigger("desk:change", "remove");
    },

    turn: function (cid) {
      if (this.isCidAllowed(cid)) {
        socket.emit("game:turn", {cid: cid});
        return true;
      }
      return false;
    },

    isCidAllowed: function (cid) {
      return _.contains(this.get("cardsAllowed"), cid);
    },

    toJSON: function () {
      var data = Backbone.Model.prototype.toJSON.call(this)
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
});
