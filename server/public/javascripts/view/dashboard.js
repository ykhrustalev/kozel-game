define([
  'view/base',
  'collection/games',
  'util/socket',
  'util/dispatcher'
], function (BaseView, GameCollection, socket, dispatcher) {

  'use strict';

  var View = BaseView.extend({

    tpl: 'dashboard',

    initialize: function () {
      var collection = this.collection = new GameCollection;

      socket.on("games:available", function (data) {
        collection.reset();
        collection.add(data);
        dispatcher.trigger("view:update", "dashboard");
      });

      socket.emit("games:available");
    },

    events: {
      "click .newGame": "newGame"
    },

    getData: function () {
      return {games: this.collection.toJSON()};
    },

    newGame: function () {
      socket.emit("game:new");
    }


  });

  return new View;

});
