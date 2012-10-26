define([
  "backbone",
  "util/dispatcher"
], function (Backbone, dispatcher) {

  "use strict";

  return Backbone.Model.extend({

    initialize: function () {

//      this.on("change", this.update, this);

      dispatcher.on("app:inGame", this.setInGame, this);
      dispatcher.on("games:change:available", this.dashboardUpdate, this);
    },

    setInGame: function (state) {
      this.set("inGame", state);
    },

    toJSON: function () {
      var attributes = Backbone.Model.prototype.toJSON.call(this);
      var cnt = attributes.meta.playersCount;
      return _.extend(attributes, {
        playersCountStr: cnt + " " + (cnt === 1 ? "участник" : "участника")
      });
    }

  });
});
