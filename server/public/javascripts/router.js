define([
  "backbone",
  "util/dispatcher",
  "util/socket",
  "view/dashboard",
  "view/desk"
], function (Backbone, dispatcher, socket, dashboardView, deskView) {

  "use strict";

  var AppRouter = Backbone.Router.extend({

    routes: {
      ""        : "triggerDashboard",
      "!/desk"  : "triggerDesk",

      // Default
      "*actions": "triggerDashboard"
    },


    showDashboard: function () {
      this.setActivePage(dashboardView);
    },

    triggerDashboard: function () {
      socket.emit("game:current");
    },

    triggerDesk: function() {
      socket.emit("game:current");
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

      var appRouter = this;

      dispatcher.on("game:created", function () {
        appRouter.navigate("", {trigger: true});
      });

      socket.on("games:available", function (data) {
        var view = appRouter.activeView;
        if (view && view.tpl== "dashboard") {
          view.collection.reset();
          view.collection.add(data);
          appRouter.setActivePage(view);
        }
      });


      socket.on("game:current", function (game) {
        if (game) {
          appRouter.navigate("!/desk", {trigger: false});
          appRouter.showDesk(game);
        } else {
          appRouter.navigate("", {trigger: false});
          appRouter.showDashboard();
        }
      });

      socket.on("game:start", function (data) {
        appRouter.navigate("!/desk", {trigger: false});
        appRouter.showDesk(data);
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