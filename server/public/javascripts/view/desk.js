define([
  "jquery",
  "view/base",
  "model/desk",
  "util/dispatcher"
], function ($, BaseView, Desk, dispatcher) {

  "use strict";

  var View = BaseView.extend({

    el: "#container",

    tpl: "desk",

    model: new Desk(),

    events: {
      'click .desk-card-element': "doTurn",
      'click .leaveGame'        : "leaveGame"
    },

    initialize: function () {
      this.model.on("change", this.update, this);

      dispatcher.on("activeView", function (view) {
        this.activeView = view;
      }, this);

      dispatcher.on("inGame", function (state) {
        this.inGame = state;
      }, this);
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

    update: function (model, changed) {
      var message = model.get("message")
        , activeView = this.activeView;

      if (message === "init") {
        dispatcher.trigger("inGame", true);
        dispatcher.trigger("route", "desk");
        dispatcher.trigger("activeView", this, {changes: changed.changes});

      } else if (message === "update") {
        dispatcher.trigger("inGame", true);
        if (!activeView || activeView === this) {
          dispatcher.trigger("route", "desk");
          dispatcher.trigger("activeView", this, {changes: changed.changes});
        }

      } else if (changed.unset) {
        dispatcher.trigger("inGame", false);
        dispatcher.trigger("route", "", true);
      }
    },

    getPartials: function () {
      return {
        players  : this.getTemplate("deskPlayers"),
        cards    : this.getTemplate("deskCards"),
        turnCards: this.getTemplate("deskTurn"),
        meta     : this.getTemplate("deskMeta")
      };
    },

    partialRender: function (options) {
      var data = this.getData()
        , changes = options.changes;

      if (changes.players) {
        this.$(".players").html(this.renderTemplate("deskPlayers", data));
      }
      if (changes.turn) {
        this.$(".cards").html(this.renderTemplate("deskCards", data));
        this.$(".turnCards").html(this.renderTemplate("deskTurn", data));
      }
      if (changes.meta) {
        this.$(".desk-info").html(this.renderTemplate("deskMeta", data));
      }
    }

  });

  return new View();
});
