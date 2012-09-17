define([
  "backbone",
  "util/dispatcher",
  "util/socket",
  "view/dashboard",
  "view/game"
], function (Backbone, dispatcher, socket, dashboardView, gameView ) {

  "use strict";

  var AppRouter = Backbone.Router.extend({

    routes: {
      ""        : "showDashboard",
      "!/game"  : "showGame",

      // Default
      "*actions": "showDashboard"
    },

    showDashboard: function () {
      console.log("show dashobard");
      this.setActivePage(dashboardView);
    },

    showGame: function (data) {
      if (data) {
        gameView.model.set(data);
      }
      this.setActivePage(gameView);
    },

    setActivePage: function (view) {
      if (this.activeView) {
        this.activeView.close();
      }
      this.activeView = view;
      view.render();
    },

    bindSocket: function () {

      var appRouter = this;

      dispatcher.on("game:created", function () {
        appRouter.navigate("", {trigger: true});
      });

      dispatcher.on("view:update", function (view) {
        // TODO: make it general
        if (view == 'dashboard' && appRouter.activeView.tpl) {
          appRouter.setActivePage(appRouter.activeView);
        }
      });


      socket.on("game:start", function (data) {
        appRouter.navigate("!/game", {trigger: false});
        appRouter.showGame(data);
      });
    }

  });

  var initialize = function () {
    var appRouter = new AppRouter;
    Backbone.history.start();
    appRouter.bindSocket();
  };

  return { initialize: initialize };
});