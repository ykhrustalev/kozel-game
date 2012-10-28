define([
  "view/base"
], function (BaseView) {

  "use strict";

  var View = BaseView.extend({

    el: "#container",

    tpl: "rules",

    events: {
      "click .goBack": "goBack"
    },

    goBack: function () {
      //TODO: route to main page?
      window.history.back();
    }
  });

  return new View();

});
