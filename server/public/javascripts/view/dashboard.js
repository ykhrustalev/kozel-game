define([
  "jquery",
  "view/base",
  "collection/games",
  "util/socket",
  "util/dispatcher"
], function ($, BaseView, GameCollection, socket, dispatcher) {

  "use strict";

  var View = BaseView.extend({

    tpl: "dashboard",

    initialize: function () {
      this.collection = new GameCollection();
    },

    events: {
      "click .newGame" : "newGame",
      "click .joinGame": "joinGame"
    },

    getData: function () {
      return {games: this.collection.toJSON()};
    },

    newGame: function () {
      socket.emit("game:create");
    },

    joinGame: function (e) {
      e.preventDefault();
      var id = $(e.currentTarget).data("id");
      socket.emit("game:join", {id: id});
      return false;
    }

  });

  return new View();

});
