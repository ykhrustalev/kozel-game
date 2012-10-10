exports.index = function (req, res) {
  res.render('index', {});
};

exports.about = function (req, res) {
  res.render('about', {
    version: "0.0.1",
    process: process
  });
};