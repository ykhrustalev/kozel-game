var url = require('url')
  , crypto = require('crypto');

var regExp = new RegExp("vk.com", "i");


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
      var profile = JSON.parse(params.api_result).response[0];
      profile.avatar = profile.photo;
      profile.uid = "vk" + profile.uid;
      callback(null, true, profile);
    }
  }
}

exports.createHandler = function (appId, appSecret) {

  return {

    canHandle: function (requst) {
      return regExp.test(requst.headers.referer);
    },

    handle: function (request, callback) {
      return parseUrl(request, callback, appId, appSecret);
    }
  };
};
