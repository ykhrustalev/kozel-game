define([
  "backbone",
  "util/socket"
], function (Backbone, socket) {

  "use strict";

  return Backbone.Model.extend({

    idAttribute: "_id",

    join: function () {
      socket.emit("games:join", {gid: this.id});
      return false;
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
