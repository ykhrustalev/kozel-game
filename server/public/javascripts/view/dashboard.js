define([
  "jquery",
  "view/base",
  "collection/dashboardList",
  "util/socket",
  "util/dispatcher"
], function ($, BaseView, DashBoardList, socket, dispatcher) {

  "use strict";

  var View = BaseView.extend({

    el: "#container",

    tpl: "dashboard",

    events: {
      "click .newGame" : "newGame",
      "click .joinGame": "joinGame"
    },

    initialize: function () {

      this.collection = new DashBoardList();

      this.collection.on("reset", this.update, this);

      dispatcher.on("activeView", function (view) {
        this.activeView = view;
      }, this);

      dispatcher.on("inGame", function (state) {
        this.inGame = state;
      }, this);
    },

    newGame: function () {
      socket.emit("games:create");
    },

    joinGame: function (e) {
      var id = $(e.currentTarget).data("id");
      this.collection.get(id).join();
    },

    update: function (model, changed) {
      console.log("update dashboard");
      var activeView = this.activeView;
      if (typeof this.inGame === "undefined") {
        dispatcher.trigger("inGame", false);
      }
      if ((!activeView && !this.inGame) || activeView === this) {
        dispatcher.trigger("route", "dashboard");
        dispatcher.trigger("activeView", this, {changes: changed.changes});
      }
    }

  });

  return new View();

});
