define([
  "jquery",
  "underscore",
  "backbone",
  "util/dispatcher",
  "util/socket",
  "view/dashboard",
  "view/desk"
  , "view/rules"
  , "view/menu"
], function ($, _, Backbone, dispatcher, socket, dashboardView, deskView, rulesView, menuView) {

  "use strict";

  function delay(callback, timeout) {
    setTimeout(callback, timeout || 5000);
  }

  var AppRouter = Backbone.Router.extend({

    routes: {
      ""        : "updateState",
      "rules"   : "showRules",
      "*actions": "updateState"
    },

    updateState: function () {
      socket.emit("app:current");
    },

    showRules: function () {
      this.setActivePage(rulesView);
      menuView.toggleRules();
    },

    showDashboard: function () {
      menuView.toggleCurrent();
      this.setActivePage(dashboardView);
    },

    showDesk: function (force) {
      menuView.toggleCurrent();
      if (deskView.isRendered()){
        deskView.partialRender();
      } else {//TODO: do it only when forced
        this.setActivePage(deskView);
      }
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


      socket.on("app:reload", function () {
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