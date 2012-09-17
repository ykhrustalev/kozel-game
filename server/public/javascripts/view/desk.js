define([
  'view/base'         ,
  'model/game',
  'util/dispatcher'
], function(BaseView, Game, dispatcher) {

  'use strict';

  var View = BaseView.extend({

    tpl: 'desk',

    model: new Game,

    events: {
      'click .turn': 'doTurn'
    },

    doTurn: function() {

      return false;
    }

  });

  return new View;
});
