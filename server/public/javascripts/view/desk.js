define([
  "jquery",
  "view/base",
  "model/game",
  "util/dispatcher",
  "util/socket"
], function ($, BaseView, Game, dispatcher, socket) {

  "use strict";

  var View = BaseView.extend({

    tpl: "desk",

    model: new Game(),

    events: {
      'click .turn': "doTurn"
    },

    doTurn: function (e) {
      e.preventDefault();
      var id = $(e.currentTarget).data("id");
      socket.emit("game:turn", {cardId: id});
      return false;
    }

  });

  return new View();
});
