module.exports = (domain, service) ->
  joinGame = (game, user, callback) ->
    service.join game, user, (error, started) ->
      if error
        callback error
      else
        domain.persist game, (error, game) ->
          callback error, game, started

  listAvailable: (callback) ->
    domain.findVacant(10, callback)

  create: (user, callback) ->
    domain.findByUid user.uid, 1, (error, games) ->
      if error
        callback error
      else if games.length
        callback "user already in game"
      else
        joinGame domain.new(), user, callback

  join: (user, gid, callback) ->
    domain.findByUid user.uid, 1, (error, games) ->
      if error
        callback error
      else if games.length
        callback "user already in game"
      else
        domain.findById gid, (error, game) ->
          if error
            callback error
          else
            joinGame game, user, callback

  getCurrent: (user, callback) ->
    domain.findByUid user.uid, 1, (error, games) ->
      if error
        callback error
      else
        callback null, if games.length then games[0] else null

  leaveCurrent: (user, callback) ->
    domain.findByUid user.uid, 1, (error, games) ->
      if error
        callback error
      else if not games.length
        callback "user is not in game"
      else
        game = games[0]
        game.leave user, (error, isEmpty) ->
          if error
            callback error
          else if isEmpty
            domain.remove game, (error) ->
              callback error, game, true
          else
            domain.persist game, callback

  turnCurrent: (user, cid, callback) ->
    domain.findByUid user.uid, 1, (error, games) ->
      if error
        callback error
      else if not games.length
        callback "user is not in game"
      else
        game = games[0]
        game.turn user, cid, (error, state, isComplete) ->
          if error
            callback error
          else if isComplete
            domain.remove game, (error) ->
              callback error, game
          else
            domain.persist game, callback
