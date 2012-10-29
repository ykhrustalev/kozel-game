({
  appDir        : "..",
  baseUrl       : "javascripts",
  dir           : "../../target",
  optimizeCss   : 'standard',
  mainConfigFile: "main.js",

  paths: {
    'jquery'    : 'lib/jquery',
    'underscore': 'lib/underscore',
    'backbone'  : 'lib/backbone',
    'hogan'     : 'lib/template-2.0.0',
    'io'        : 'lib/socket.io',
    'json2'     : 'lib/json2',
    'bootstrap' : 'lib/bootstrap'
  },

  modules: [
    {
      name: "main"
    }
  ]
})