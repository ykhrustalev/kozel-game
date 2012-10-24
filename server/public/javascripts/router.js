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
      ""        : "updateState",
      "rules"   : "showRules",
      "*actions": "updateState"
    },

    updateState: function () {
      socket.emit("app:current");
      if (this.activeView) {
        this.activeView.close();
        this.activeView = null;
      }
    },

    showRules: function () {
      menuView.toggleRules().render();
      this.setActivePage(rulesView);
    },

    showDashboard: function () {
      menuView.toggleDashboard();
      this.setActivePage(dashboardView);
    },

    showDesk: function (force) {
      if (force || !this.activeView || this.activeView === deskView) {
        this.setActivePage(deskView);
        menuView.toggleDesk().setDeskUpdates(false).render();
      } else {
        menuView.setDeskUpdates(true).render();
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

      menuView.render();

      dispatcher.on("games:updated", function (filter) {
        return router.showDashboard(); //TODO: ???

        if (filter === dashboardView.collection.filter) {
          var activeView = router.activeView;
          if (!activeView || activeView === dashboardView) {
            router.setActivePage(dashboardView);
          }
        }
      });

      dispatcher.on("desk:updated", router.showDesk, router);

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