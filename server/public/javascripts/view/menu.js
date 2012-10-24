define(["view/base"], function (Base) {

  "use strict";

  var View = Base.extend({

    el: "#menu",

    tpl: "menu",

    events: {
//      "click .joinGame": "joinGame"
    },

    initialize: function () {
      this.items = {
        "rules": {
          active: false
        }
      }
    },

    toggleRules: function () {
      this.items.rules.active = true;
      this.render();
    },

    toggleCurrent: function () {
      this.items.rules.active = false;
      this.render();
    },

    getData: function () {
      return _.clone(this.items);
    }

  });

  return new View();
});
