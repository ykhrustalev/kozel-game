define([
  "underscore",
  "view/base",
  "util/dispatcher",
  "view/desk"
], function (_, Base, dispatcher, deskView) {

  "use strict";

  var View = Base.extend({

    el: "#menu",

    tpl: "menu",

    initialize: function () {
      this.items = {
        desk     : {},
        dashboard: {},
        rules    : {
          enabled: true
        }
      };

      deskView.model.on("change", function (model, changed) {
        if (this.route !== "desk") {
          this.setDeskUpdates(true).render();
        }
      }, this);

      dispatcher.on("route", function (route) {
        this.route = route;
        switch (route) {
          case"desk":
            this.setDeskUpdates(false).toggleDesk().render();
            break;
          case"dashboard":
            this.toggleDashboard().render();
            break;
          case"rules":
            this.toggleRules().render();
            break;
        }
      }, this);

      dispatcher.on("inGame", this.setInGame, this);
    },

    toggleRules: function () {
      this.items.desk.active = false;
      this.items.dashboard.active = false;
      this.items.rules.active = true;
      return this;
    },

    toggleDashboard: function () {
      this.items.desk.active = false;
      this.items.dashboard.active = true;
      this.items.rules.active = false;
      return this;
    },

    toggleDesk: function () {
      this.items.desk.active = true;
      this.items.dashboard.active = false;
      this.items.rules.active = false;
      return this;
    },

    setDeskUpdates: function (state) {
      this.items.desk.updates = state;
      return this;
    },

    setInGame: function (state) {
      if (state) {
        this.items.desk.enabled = true;
        this.items.dashboard.enabled = false;
      } else {
        this.items.desk.enabled = false;
        this.items.dashboard.enabled = true;
      }
      this.render();
      return this;
    },

    getData: function () {
      var items = this.items
        , data = {};

      if (items.desk.enabled) {
        data.desk = items.desk;
      }
      if (items.dashboard.enabled) {
        data.dashboard = items.dashboard;
      }
      if (items.rules.enabled) {
        data.rules = items.rules;
      }

      return data;
    }

  });

  return new View();
});
