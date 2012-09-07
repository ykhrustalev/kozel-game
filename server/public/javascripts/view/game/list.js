define([
  'view/base'
], function(BaseView) {

  'use strict';

  var View = BaseView.extend({

    tpl: 'gameList',

    initialize: function() {
    }
  });

  return new View;
});
