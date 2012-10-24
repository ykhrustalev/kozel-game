define(["backbone"], function (Backbone) {

  "use strict";

  return Backbone.View.extend({

    tagName: "li",

    events: {
      "click .joinGame": "joinGame"
    },

    joinGame: function () {
      this.model.join();
    }
  });
});
