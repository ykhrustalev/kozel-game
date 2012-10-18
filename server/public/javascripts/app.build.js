({
  appDir: "../",
  baseUrl: "javascripts",
  dir: "../../build",
  outDir: "../../build",
  paths: {
    'jquery' : 'lib/jquery',
    'underscore' : 'lib/underscore',
    'backbone' : 'lib/backbone',
    'backboneValidation' : 'lib/backbone-validation-amd',
    'hogan' : 'lib/template-2.0.0',
    'io' : 'lib/socket.io',
    'json2' : 'lib/json2'
  },
  modules: [
    {
      name: "config"
    }
  ]
})