define([
  "backbone",
  "util/dispatcher",
  "util/socket",
  "view/dashboard",
  "view/desk",
  "view/rules",
  "view/menu",
  "model/appState"
], function (Backbone, dispatcher, socket, dashboardView, deskView, rulesView, menuView, appState) {

  "use strict";

  var AppRouter = Backbone.Router.extend({

    routes: {
      ""         : "updateState",
      "desk"     : "desk",
      "dashboard": "showDashboard",
      "rules"    : "showRules",
      "*actions" : "updateState"
    },

    updateState: function () {
      socket.emit("app:current");
      appState.showDefault();
    },

    showRules: function () {
      appState.showRules();
    },

    showDashboard: function () {
      appState.showDashboard();
    },

    desk: function () {
      appState.showDesk(true);
    },

    bindSocket: function () {

      var router = this;

//      dispatcher.on("app:inGame", router.setInGame, router);
//
//      dispatcher.on("games:change:available", function () {
//        if (!router.activeView || router.activeView === dashboardView) {
//          router.setActivePage(dashboardView);
//          menuView.toggleDashboard().render();
//        }
//      });
//
//      dispatcher.on("desk:leftGame", function () {
//        router.isInGame = false;
//        menuView.setInGame(false);
//      });
//
//      dispatcher.on("desk:activated", function () {
//        router.isInGame = true;
//        menuView.setInGame(true);
//        router.navigate("desk", {trigger: true});
//      });
//
//      dispatcher.on("desk:deactivated", function () {
//        router.isInGame = false;
//        menuView.setInGame(false);
//        router.navigate("desk", {trigger: true});
//      });
//
//      dispatcher.on("desk:updated", router.showDesk, router);
//
//      dispatcher.on("route", function (route) {
//        router.navigate(route, {trigger: true});
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