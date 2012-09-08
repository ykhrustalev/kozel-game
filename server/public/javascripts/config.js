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
    backboneModelBinder: "lib/Backbone.ModelBinder",
    hogan: "lib/template-2.0.0",
    io: "lib/socket.io"
  },

  shim: {
    hogan: {
      exports: 'Hogan'
    },
    io : {
      exports: 'io'
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