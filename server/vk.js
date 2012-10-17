var url = require('url')
  , crypto = require('crypto');

function parseUrl(request, callback, appId, appSecret) {

  var urlSchema = url.parse(request.headers.referer, true)
    , params = urlSchema.query
    , md5 = crypto.createHash('md5');

  if (!params.api_id || !params.auth_key || !params.viewer_id || !params.api_result) {
    callback("missing required parameters in request");
  } else if (params.api_id !== appId) {
    callback("app_id from different application");
  } else {
    md5.update(params.api_id + '_' + params.viewer_id + '_' + appSecret);
    if (params.auth_key !== md5.digest('hex')) {
      callback("auth key mismatched");
    } else {
      callback(null, true, JSON.parse(params.api_result).response[0]);
    }
  }
}

module.exports = {
  authHandler: function (appId, appSecret) {
    return function (url, callback) {
      return parseUrl(url, callback, appId, appSecret);
    };
  }
};
