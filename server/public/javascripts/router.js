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
      ""         : "index",
      "desk"     : "desk",
      "dashboard": "dashboard",
      "rules"    : "rules",
      "*actions" : "index"
    },

    initialize: function () {

      dispatcher.on("inGame", function (state) {
        this.inGame = state;
      }, this);

      dispatcher.on("activeView", this.setActivePage, this);

      dispatcher.on("route", this.updateRoute, this);

      socket.emit("app:current");
    },

    index: function () {
      console.log("route index");
      dispatcher.trigger("route", "", true);
    },

    rules: function () {
      console.log("route rules");
      dispatcher.trigger("route", "rules");
      dispatcher.trigger("activeView", rulesView);
    },

    dashboard: function () {
      console.log("route dashboard");
      if (this.inGame) {
        dispatcher.trigger("route", "", true);
      } else {
        dispatcher.trigger("route", "dashboard");
        dispatcher.trigger("activeView", dashboardView);
      }
    },

    desk: function () {
      console.log("route desk");
      if (!this.inGame) {
        dispatcher.trigger("route", "", true);
      } else {
        dispatcher.trigger("route", "desk");
        dispatcher.trigger("activeView", deskView);
      }
    },

    updateRoute: function (route, trigger) {
      if (!route) {
        route = this.inGame ? "desk" : "dashboard";
      }
      this.navigate(route, {trigger: trigger});
    },

    setActivePage: function (view, options) {
      console.log("render view: " + view.tpl, options);
      if (this.activeView && this.activeView !== view) {
        this.activeView.close(); //TODO: should close always?
      }
      this.activeView = view;
      view.render(options);
    }
  });

  return {
    initialize: function () {
      var appRouter = new AppRouter();
      Backbone.history.start();
    }
  };
});
