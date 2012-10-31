var fs = require('fs')
  , hogan = require('hogan.js');

// Remove utf-8 byte order mark, http://en.wikipedia.org/wiki/Byte_order_mark
function removeBOM(text) {
  return (text.charCodeAt(0) === 0xfeff) ? text.substring(1) : text;
}

function readSharedTemplates(scanDir) {
  var dir = fs.readdirSync(scanDir)
    , compiledTemplates = [];

  dir.forEach(function (template, i) {
    var name = template.substr(0, template.lastIndexOf("."))
      , contents = removeBOM(fs.readFileSync(scanDir + template, "utf8"));

    compiledTemplates.push({
      id    : name,
      script: hogan.compile(contents, {asString: true}),
      // Since mustache doesn't boast an 'isLast' function we need to do that here instead.
      last  : i === dir.length - 1
    });
  });

  return compiledTemplates;
}

function getTemplatesContents(wrapperFile, templates) {
  var template = hogan.compile(removeBOM(fs.readFileSync(wrapperFile, "utf8")));
  return template.render({
    templates: templates
  });
}

exports.init = function (scanDir) {
  return {
    getContents: function (wrapperFile) {
      return getTemplatesContents(wrapperFile, readSharedTemplates(scanDir));
    }
  };
};
