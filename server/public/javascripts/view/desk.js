define([
  "jquery",
  "view/base",
  "model/desk",
  "util/dispatcher",
  "templates"
], function ($, BaseView, Desk, dispatcher, Templates) {

  "use strict";

  var View = BaseView.extend({

    tpl: "desk",

    model: new Desk(),

    events: {
      'click .desk-card-element': "doTurn",
      'click .leaveGame'        : "leaveGame"
    },

    leaveGame: function () {
      this.model.leave();
    },

    doTurn: function (e) {
      e.preventDefault();
      var target = $(e.currentTarget)
        , cid = target.data("id")
        , model = this.model;

      if (model.isCidAllowed(cid)) {
        if (this.selectedCid === cid) {
          model.turn(cid);
        } else {
          this.selectedCid = cid;
          this.$el.find(".selected").removeClass("selected");
          target.addClass("selected");
        }
      }
      return false;
    },

    getPartials: function () {
      return {
        cards    : this.getTemplate("deskCards"),
        turnCards: this.getTemplate("deskTurn"),
        meta     : this.getTemplate("deskMeta")
      };
    },

    partialRender: function () {
      var data = this.getData();
      this.$(".cards").html(this.renderTemplate("deskCards", data));
      this.$(".turnCards").html(this.renderTemplate("deskTurn", data));
      this.$(".desk-info").html(this.renderTemplate("deskMeta", data));
    }

  });

  return new View();
});
