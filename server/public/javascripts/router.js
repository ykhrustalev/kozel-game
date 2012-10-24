define([
  "backbone",
  "util/dispatcher",
  "util/socket",
  "view/dashboard",
  "view/desk",
  "view/rules",
  "view/menu"
], function (Backbone, dispatcher, socket, dashboardView, deskView, rulesView, menuView) {

  "use strict";

  var AppRouter = Backbone.Router.extend({

    routes: {
      ""         : "updateState",
      "desk"     : "showDesk",
      "dashboard": "showDashboard",
      "rules"    : "showRules",
      "*actions" : "updateState"
    },

    updateState: function () {
      socket.emit("app:current");
      if (this.activeView) {
        this.activeView.close();
        this.activeView = null;
      }
    },

    showRules: function () {
      if (typeof this.isInGame === "undefined") {
        socket.emit("app:current");
      }
      menuView.toggleRules().render();
      this.setActivePage(rulesView);
    },

    showDashboard: function () {
      if (this.isInGame) {
        this.navigate("desk", {trigger: true});
      } else {
        this.setActivePage(dashboardView);
        menuView.toggleDashboard().setInGame(false).render();
      }
    },

    showDesk: function () {
      if (!this.isInGame) {
        this.navigate("dashboard", {trigger: true});
      } else {
        this.setActivePage(deskView);
        menuView.toggleDesk().setDeskUpdates(false).render();
      }
    },

    setActivePage: function (view) {
      if (this.activeView && this.activeView !== view) {
        this.activeView.close();
      }
      this.activeView = view;
      view.render();
    },

    bindSocket: function () {

      var router = this;

      dispatcher.on("games:updated:available", function () {
        if (!router.activeView || router.activeView === dashboardView) {
          router.setActivePage(dashboardView);
          menuView.toggleDashboard().render();
        }
      });

      dispatcher.on("desk:inGame", function () {
        router.isInGame = true;
        menuView.setInGame(true);
      });

      dispatcher.on("desk:leftGame", function () {
        router.isInGame = false;
        menuView.setInGame(true);
      });

      dispatcher.on("desk:activated", function () {
        router.isInGame = true;
        menuView.setInGame(true);
        router.navigate("desk", {trigger: true});
      });

      dispatcher.on("desk:deactivated", function () {
        router.isInGame = false;
        menuView.setInGame(false);
        router.navigate("desk", {trigger: true});
      });

      dispatcher.on("desk:updated", function () {
        if (!router.activeView || router.activeView === deskView) {
          router.setActivePage(deskView);
          menuView.toggleDesk().setDeskUpdates(false).render();
        } else {
          menuView.setDeskUpdates(true).render();
        }
      });

      dispatcher.on("route", function (route) {
        router.navigate(route, {trigger: true});
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