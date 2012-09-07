define([
  'view/base',
  'collection/games'
], function(BaseView, GameCollection) {

  'use strict';

  var View = BaseView.extend({

    tpl: 'dashboard',

    initialize: function() {

      this.collection = new GameCollection;
    }
  });

  return new View;

});
