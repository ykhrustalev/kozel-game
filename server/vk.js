var config = require("./config")
  , url = require('url')
  , crypto = require('crypto');

function getAuthKey(params) {
  var appId = params.api_id
    , viewerId = params.viewer_id
    , apiSecret = config.vk.appSecret
    , md5 = crypto.createHash('md5');
  md5.update(appId + '_' + viewerId + '_' + apiSecret);
  return md5.digest('hex');
}

var Vk = {
  parseUrl: function (urlString) {

    var urlSchema = url.parse(urlString, true)
      , urlParams = urlSchema.query
      , apiId = urlParams.api_id
      , authKey = urlParams.auth_key
      , apiResult = urlParams.api_result
      , isAuthenticated = true
      , profile = {};

    if (apiId && apiId !== config.vk.appId) {
      console.log("app_id from different application");
      isAuthenticated = false;
    }

    if (authKey && authKey.toLocaleLowerCase()
      !== getAuthKey(urlParams).toLocaleLowerCase()) {
      console.log("wrong key");
      isAuthenticated = false;
    }

    if (apiResult) {
      profile = JSON.parse(apiResult).response[0];
    } else {
      isAuthenticated = false;
    }

    return {
      profile        : profile,
      isAuthenticated: isAuthenticated
    };
  }

};

module.exports = Vk;