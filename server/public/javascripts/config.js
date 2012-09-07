/**
 * Dependencies configuration
 */
require.config({

  paths: {
    json2: "lib/json2",
    jquery: "lib/jquery",
    underscore: "lib/underscore",
    backbone: "lib/backbone",
    backboneValidation: "lib/backbone-validation-amd",
    backboneModelBinding: "lib/backbone.modelbinding",
    hogan: "lib/template-2.0.0"
  },

  shim: {
    hogan: {
      exports: 'Hogan'
    },
    underscore: {
      exports: "_"
    },
    backbone: {
      deps: ["underscore", "jquery"],
      exports: "Backbone"
    },
    backboneModelbinding: {
      deps: ["backbone", 'underscore' ]
    }
  }

});

require([
  'router',
  'json2',
  'util/ajax'
], function(Router) {
  Router.initialize();
});