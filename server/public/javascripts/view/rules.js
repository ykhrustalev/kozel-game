define([
  "jquery",
  "view/base"
], function ($, BaseView) {

  "use strict";

  var View = BaseView.extend({
    tpl: "rules",

    events: {
      "click .goBack": "goBack"
    },

    afterRender: function  () {
      $(".app-link-rules").addClass("active");
    },

    goBack: function () {
      //TODO: route to main page?

    }
  });

  return new View();

});
