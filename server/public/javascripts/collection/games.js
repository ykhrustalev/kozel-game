define([
  'backbone',
  'model/game'
], function(Backbone, GameModel) {

  'use strict';

  return Backbone.Collection.extend({
    model: GameModel
  });
});