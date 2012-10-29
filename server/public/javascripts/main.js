/**
 * Dependencies configuration
 */
require.config({

  paths: {
    json2             : "lib/json2",
    jquery            : "lib/jquery",
    underscore        : "lib/underscore",
    backbone          : "lib/backbone",
    backboneValidation: "lib/backbone-validation-amd",
    hogan             : "lib/template-2.0.0",
    io                : "lib/socket.io",
    bootstrap         : "lib/bootstrap"
  },

  shim: {

    bootstrap: {
      deps: ["jquery"]
    },

    hogan: {
      exports: "Hogan"
    },

    io: {
      exports: "io"
    },

    underscore: {
      exports: "_"
    },

    backbone: {
      deps   : ["underscore", "jquery"],
      exports: "Backbone"
    }
  }

});

require([
  "router",
  "json2"
], function (router) {
  router.initialize();
});