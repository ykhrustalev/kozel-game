define([
  "backbone",
  "model/dashboardItem",
  "util/socket",
  "util/dispatcher"
], function (Backbone, DashboardItem, socket, dispatcher) {

  "use strict";

  return Backbone.Collection.extend({

    model: DashboardItem,

    initialize: function (options) {

      var self = this;
      socket.on("games:list", function (data) {
        if (data.filter === "available") {
          self.reset();
          self.add(data.objects);
          dispatcher.trigger("dashboard:change");
        }
      });
    },

    toJSON: function () {
      var games = Backbone.Collection.prototype.toJSON.call(this);
      return {
        games    : games,
        gameCount: games.length || null
      };
    }

  });
});