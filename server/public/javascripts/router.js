define([
  "underscore",
  "backbone",
  "util/dispatcher",
  "util/socket",
  "view/dashboard",
  "view/desk"
], function (_, Backbone, dispatcher, socket, dashboardView, deskView) {

  "use strict";

  var AppRouter = Backbone.Router.extend({

    routes: {
      "*actions": "updateState"
    },

    updateState: function () {
      // TODO: remove debug
      socket.emit("session");
      socket.emit("game:current");
    },

    showDashboard: function (games) {
      dashboardView.collection.reset();
      dashboardView.collection.add(games);
      this.setActivePage(dashboardView);
    },

    showDesk: function (data) {
      console.log(data);
      deskView.model.set(data);
      this.setActivePage(deskView);
    },

    setActivePage: function (view) {
      if (this.activeView) {
        this.activeView.close();
      }
      this.activeView = view;
      view.render();
    },

    bindSocket: function () {

      var router = this;

      socket.on("game:created", function (game) {
        router.showDesk(game);
      });

      socket.on("game:list:available", function (games) {
        router.showDashboard(games);
      });

      socket.on("game:current", function (data) {
        router.showDesk(data);
      });

      socket.on("game:start", function (game) {
        router.showDesk(game);
      });

      socket.on("game:update", function (game) {
        router.updateState();
      });

      // TODO: remove debug
//      socket.on("session", function (data) {
//        console.log("session", data.handshake.sessionID, data.handshake);
//      });
    }

  });

  return {
    initialize: function () {
      var appRouter = new AppRouter();
      Backbone.history.start();
      appRouter.bindSocket();
    }
  };
});