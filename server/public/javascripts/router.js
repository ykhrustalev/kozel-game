define([
  "underscore",
  "backbone",
  "util/dispatcher",
  "util/socket",
  "view/dashboard",
  "view/desk"
], function (_, Backbone, dispatcher, socket, dashboardView, deskView) {

  "use strict";

  function delay(callback, timeout) {
    setTimeout(callback, timeout || 5000);
  }

  var AppRouter = Backbone.Router.extend({

    routes: {
      "*actions": "updateState"
    },

    updateState: function () {
      socket.emit("game:current");
    },

    showDashboard: function (games) {
      dashboardView.collection.reset();
      dashboardView.collection.add(games);
      this.setActivePage(dashboardView);
    },

    showDesk: function (data) {
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

      socket.on("game:list:available", function (games) {
        router.showDashboard(games);
      });

      socket.on("game:created", function (game) {
        router.showDesk(game);
      });
      socket.on("game:joined", function (data) {
        router.showDesk(data);
      });

      socket.on("game:started", function (game) {
        router.showDesk(game);
      });

      socket.on("game:current", function (data) {
        router.showDesk(data);
      });

      socket.on("game:newTurn", function (data) {
        delay(function () {
          router.showDesk(data);
        });
      });

      socket.on("game:newRound", function (game) {
        delay(function () {
          router.showDesk(game);
        })
      });

      socket.on("game:queenCaught", function (game) {
        delay(function () {
          router.showDesk(game);
        })
      });

      socket.on("game:update", function (game) {
        router.updateState();
      });

      socket.on("game:reload", function () {
        window.location.reload();
      });

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