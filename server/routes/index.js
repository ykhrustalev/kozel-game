exports.index = function (req, res) {
  res.render('index', {});
};

exports.health = require("./health").heath;
