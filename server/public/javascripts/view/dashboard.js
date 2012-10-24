define([
  "jquery",
  "view/base",
  "view/dashboardItem",
  "collection/dashboardList",
  "util/socket",
  "util/dispatcher"
], function ($, BaseView, ItemView, DashBoardList, socket, dispatcher) {

  "use strict";

  var View = BaseView.extend({

    tpl: "dashboard",

    events: {
      "click .newGame": "newGame",
      "click .joinGame": "joinGame"
    },

    initialize: function () {
      this.collection = new DashBoardList({filter: "available"});
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
