define([
  'view/base'         ,
  'model/game',
  'util/dispatcher'
], function(BaseView, Game, dispatcher) {

  'use strict';

  var NewContest = BaseView.extend({

    tpl: 'gameNew',

    model: new Game,

    events: {
      'submit form': 'save'
    },

    save: function() {
      var model = this.model;
      model.validate();
      if (model.isValid()) {
        model.save({}, {wait: true, success: function(model, response) {
          dispatcher.trigger('contest:created', model);
        }});
      }
      return false;
    }

  });

  return new NewContest;
});
