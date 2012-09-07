define([
  'view/base'
], function(BaseView) {

  'use strict';

  var ContestItemView = BaseView.extend({

    tpl: 'gameItem',

    initialize: function() {
    }
  });

  return new ContestItemView;
});
