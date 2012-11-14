module.exports =

  canHandle: (request) -> if request.query.uid then true else false

  handle: (request, callback) ->
    uid = request.query.uid
    callback null,
      uid       : "mock #{uid}"
      first_name: "User #{uid}"
      last_name : "Surname"
      avatar    : "/images/default-avatar.png"
