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

      this.filter = options.filter;

      var self = this;
      socket.on("games:list", function (data) {
        if (data.filter === self.filter) {
          self.reset();
          self.add(data.objects);
          dispatcher.trigger("games:updated", self.filter);
        }
      });
    },

    toJSON: function () {
      var games = Backbone.Collection.prototype.toJSON.call(this);
      return {
        games    : games,
        gameCount: games.length || null
      };
    },

    fetch: function () {
      socket.emit("games:list", {filter: self.filter});
    }

  });
});