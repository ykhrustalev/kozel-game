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

    initialize:function  () {
      // TODO: catch updates here?
      var self = this;
//      dispatcher.on("desk:update", function  (force) {
//        if (self.isRendered()){
//          self.partialRender();
//        } else if (force){
////          self.render();
//        }
//      });
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

    getPartials: function  () {
      return {
        cards: this.getTemplate("deskCards"),
        turnCards: this.getTemplate("deskTurn")
      };
    },

    partialRender: function () {
      var data = this.getData()
        , cards = this.renderTemplate("deskCards", data)
        , turnCards = this.renderTemplate("deskTurn", data);
      this.$(".cards").html(cards);
      this.$(".turnCards").html(turnCards);
    }

  });

  return new View();
});
