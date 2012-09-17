define([
  'view/base'         ,
  'model/game',
  'util/dispatcher'
], function(BaseView, Game, dispatcher) {

  'use strict';

  var View = BaseView.extend({

    tpl: 'game',

    model: new Game,

    events: {
      '.turn': 'save'
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

  return new View;
});
