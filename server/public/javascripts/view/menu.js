define([
  "underscore",
  "view/base"
], function (_, Base) {

  "use strict";

  var View = Base.extend({

    el: "#menu",

    tpl: "menu",

    events: {
//      "click .joinGame": "joinGame"
    },

    initialize: function () {
      this.items = {
        desk : {
          active : false,
          enabled: false,
          updates: false
        },
        dashboard: {
          active: false
        },
        rules: {
          active: false
        }
      };
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

    getData: function () {
      return _.clone(this.items);
    }

  });

  return new View();
});
