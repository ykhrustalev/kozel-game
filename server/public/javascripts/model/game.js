define([
  "backbone"
], function (Backbone) {

  "use strict";

  return Backbone.Model.extend({

    idAttribute: "_id",

    defaults: {
      genders_allowed: 0
    },

    initialize: function () {
//      this.id = null;
      this.title = '';
      this.owner = '';
    },

    validation: {
      title: [
        {
          required: true,
          msg     : 'Обязательное поле'
        },
        {
          maxLength: 255,
          msg      : 'Максимум 255 символов'
        }
      ]
    }

  });
});