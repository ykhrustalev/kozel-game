define([
  "backbone",
  "util/socket",
  "util/dispatcher",
  "view/dashboard",
  "view/desk",
  "view/rules",
  "view/menu"
], function (Backbone, socket, dispatcher, dashboardView, deskView, rulesView, menuView) {

  "use strict";

  var Model = Backbone.Model.extend({

    defaults: {
      inGame: null,
      route : null
    },

    initialize: function () {
      this.on("change", this.update, this);
      dispatcher.on("desk:change", this.updateDesk, this);
      dispatcher.on("dashboard:change", this.updateDashboard, this);
    },

    checkState: function () {
      if (this.get("inGame") === null) {
        socket.emit("app:current");
        return false;
      }
      return true;
    },

    update: function () {
      var view;

      menuView.setInGame(this.get("inGame"));

      switch (this.get("route")) {
        default:
          if (this.activeView) {
            view = this.activeView;
          } else {
            view = dashboardView;
          }
          break;
        case "dashboard":
          menuView.toggleDashboard();
          view = dashboardView;
          break;
        case "desk":
          menuView.toggleDesk();
          view = deskView;
          break;
        case "rules":
          menuView.toggleRules();
          view = rulesView;
          break;
      }

      if (this.get("gameUpdates") && view !== deskView) {
        menuView.setDeskUpdates(true);
      }
      menuView.render();

      if (view) {
        this.setActivePage(view);
      }
    },


    showDefault: function () {
      if (!this.checkState()) {
        return;
      }

      if (this.get("inGame")) {
        this.showDesk();
      } else {
        this.showDashboard();
      }
    },

    showDesk: function () {

      if (!this.checkState()) {
        return;
      }

      if (!this.get("inGame")) {
        return;
      }

      this.set({
        inGame: true,
        route : "desk"
      });
    },

    updateDesk: function (state) {
      console.log("updateDesk, " + state);
      if (state === "init") {
        this.set({
          route : "desk",
          inGame: true
        });
      } else if (state === "update") {
        var options = {inGame: true};
        if (!this.activeView || this.activeView === deskView) {
          options.route = "desk";
        } else {
          options.gameUpdates = true;
        }
        this.set(options);
      } else if (state === "remove") {
        this.set({
          route : "dashboard",
          inGame: false
        });
      }
    },

    showDashboard: function () {

      if (!this.checkState()) {
        return;
      }

      console.log("updateDashboard");
      if (!this.get("inGame")) {
        this.set({
          route: "dashboard"
        });
      }
    },

    updateDashboard: function () {
      if (!this.activeView || this.activeView === dashboardView) {
        this.set({
          inGame: false,
          route : "dashboard"
        });
      }
    },

    showRules: function () {

      this.checkState();

      this.set({
        route: "rules"
      });
    },


    setActivePage: function (view) {
      if (this.activeView && this.activeView !== view) {
        this.activeView.close(); //TODO: should close always?
      }
      this.activeView = view;
      view.render();
    }

  });
  return new Model();
});
