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
      var games = this.collection.toJSON();
      return {
        games: games,
        gameCount: games.length || null
      };
    },

    newGame: function () {
      socket.emit("game:create");
    },

    joinGame: function (e) {
      e.preventDefault();
      var id = $(e.currentTarget).data("id");
      socket.emit("game:join", {gid: id});
      return false;
    }

  });

  return new View();

});
