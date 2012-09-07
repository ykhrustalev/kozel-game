module.exports.api = function (app) {
  var
    hogan = require('hogan.js'),
    fs = require('fs'),
    compiledFile = __dirname + "/public/javascripts/templates.js",
    scanDir = __dirname + "/views/shared/",
    wrapperFile = __dirname + "/views/wrapper.html",
    sharedTemplateTemplate = hogan.compile(removeByteOrderMark(fs.readFileSync(wrapperFile, "utf8")));

  // Remove utf-8 byte order mark, http://en.wikipedia.org/wiki/Byte_order_mark
  function removeByteOrderMark(text) {
    if (text.charCodeAt(0) === 0xfeff) {
      return text.substring(1);
    }
    return text;
  }

  /**
   * The Express hogan template renderer.
   */
  var hoganHtmlRenderer = {
    compile: function (source, options) {
      return function (options) {
        var template = hogan.compile(source);
        return template.render(options.context, options.partials);
      };
    }
  };

  /**
   * Reads and compiles hogan templates from the shared template
   * directory to stringified javascript functions.
   */
  function readSharedTemplates() {
    var sharedTemplateFiles = fs.readdirSync(scanDir);

    // Here we'll stash away the shared templates compiled script (as a string) and the name of the template.
    app.sharedTemplates = [];

    // Hogan like it's partials as template contents rather than a path to the template file
    // so we'll stash each template in a partials object so they're available for use
    // in other templates.
    app.sharedPartials = {};

    // Iterate over each sharedTemplate file and compile it down to a javascript function which can be
    // used on the client
    sharedTemplateFiles.forEach(function (template, i) {
      var functionName = template.substr(0, template.lastIndexOf(".")),
        fileContents = removeByteOrderMark(fs.readFileSync(scanDir + template, "utf8"));

      // Stash the partial reference.
      app.sharedPartials[functionName] = fileContents;
      // Stash the compiled template reference.
      app.sharedTemplates.push({
        id: functionName,
        script: hogan.compile(fileContents, {asString: true}),
        // Since mustache doesn't boast an 'isLast' function we need to do that here instead.
        last: i === sharedTemplateFiles.length - 1
      });
    });
  }

  function readSharedTemplatesMiddleware(req, res, next) {
    if (!app.sharedTemplates || app.settings.env === "development") {
      readSharedTemplates();
    }
    next();
  }


  // Read the templates initially when starting up
  readSharedTemplates();

  /**
   * Request handler for pre-compiled hogan.js templates.
   *
   * This function uses a hogan template of it's own which renders
   * calls to Hogan.Tempate. See views/sharedTemplates.mustache.
   */
  if (app.settings.env === "development") {
    app.get("/javascripts/templates.js", readSharedTemplatesMiddleware, function (req, res, next) {
      var content = sharedTemplateTemplate.render({
        templates: app.sharedTemplates
      });
      res.contentType("application/javascript");
      res.send(content);
    });
  } else {
    var content = sharedTemplateTemplate.render({
      templates: app.sharedTemplates
    });
    fs.writeFileSync(compiledFile, content, "utf8");
  }
};
