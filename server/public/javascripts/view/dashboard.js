define([
  "jquery",
  "view/base",
  "collection/dashboardList",
  "util/socket",
  "util/dispatcher"
], function ($, BaseView, DashBoardList, socket, dispatcher) {

  "use strict";

  var View = BaseView.extend({

    tpl: "dashboard",

    events: {
      "click .newGame": "newGame",
      "click .joinGame": "joinGame"
    },

    initialize: function () {
      this.collection = new DashBoardList();
    },

    newGame: function () {
      socket.emit("games:create");
    },

    joinGame: function  (e) {
      var id = $(e.currentTarget).data("id");
      this.collection.get(id).join();
    }

  });

  return new View();

});
