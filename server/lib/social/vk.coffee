url = require "url"
crypto = require "crypto"
regExp = new RegExp("vk.com", "i")

module.exports = (appId, appSecret) ->
  canHandle: (requst) -> regExp.test requst.headers.referer

  handle: (request, callback) ->
    urlSchema = url.parse request.headers.referer, true
    params = urlSchema.query
    md5 = crypto.createHash "md5"

    if not params.api_id or not params.auth_key or not params.viewer_id or not params.api_result
      callback "vk: missing required parameters in request"
    else if params.api_id isnt appId
      callback "vk: app_id from different application"
    else
      md5.update "#{params.api_id}_#{params.viewer_id}_#{appSecret}"
      if params.auth_key isnt md5.digest("hex")
        callback "vk: auth key mismatched"
      else
        profile = JSON.parse(params.api_result).response[0]
        profile.avatar = profile.photo
        profile.uid = "vk#{profile.uid}"
        callback null, profile
