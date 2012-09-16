var config = require("./config"),
    url = require('url'),
    crypto = require('crypto');

function getAuthKey(params) {
  var appId = params['api_id'],
      viewerId = params['viewer_id'],
      apiSecret = config.VK_APP_SECRET;

  var md5sum = crypto.createHash('md5');
  md5sum.update(appId + '_' + viewerId + '_' + apiSecret);
  return md5sum.digest('hex');
}

var Vk = {
  parseUrl: function (urlString) {

    var urlSchema = url.parse(urlString, true),
        urlParams = urlSchema.query,
        isAuthenticated = true,
        profile = {};

    // TODO: handle incorrect url and exceptions

    if (urlParams['api_id'] !== config.VK_APP_ID) {
      console.log("app_id from different application");
      isAuthenticated = false;
    }

    if (urlParams["auth_key"].toLocaleLowerCase()
        !== getAuthKey(urlParams).toLocaleLowerCase()) {
      console.log("wrong key");
      isAuthenticated = false;
    }

    profile = JSON.parse(urlParams["api_result"]).response[0];

    return {
      profile        : profile,
      isAuthenticated: isAuthenticated
    };
  }

};

module.exports = Vk;