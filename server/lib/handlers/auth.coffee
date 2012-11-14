# Authorization handler, uses request to derive user information.
# Uses standalone modules to contact social networks.
# Handler should implement functions:
# - canHandle(request)
# - handle(request, callback)
#
# callback should take parameters:
# - {Mixed} error
# - {boolean} isAuthenticated
# - {Object} profile - {uid, first_name, last_name}
#
# @param sessionStore
# @param handlers
# @param secret
# @return {Object} wrapper for handlers
module.exports = (sessionStore, handlers, secret) ->
  cookie = require "cookie"
  express = require "express"
  Session = express.session.Session
  # previously was used from standalone module `connect`
  connectUtils = require "express/node_modules/connect/lib/utils"

  authorize: (data, accept) ->

    # Deriving express cookie here to define whether user has already
    # established session
    # Creating structure for the Session module that looks like request
    try
      signedCookies = cookie.parse decodeURIComponent data.headers.cookie
      data.cookie = connectUtils.parseSignedCookies signedCookies, secret
      data.sessionID = data.cookie["express.sid"]
      data.sessionStore = sessionStore
    catch error
      console.warn "failed parsing cookies: #{error}"
      accept 'Malformed cookie transmitted', false
      return

    # restore session
    sessionStore.load data.sessionID, (error, session) ->
      if error
        console.warn "error in session storage: #{error}"
        accept "Server error", false
        return

      # Cookie exists but session is missing in storage. Probably it could
      # be due to server reset or cache flush. So need to create a new
      # session but notify the end user.
      # Client is actually not allowed to get session but in order to
      # allow auto refresh on client we grand new session but mark it with
      # `reload` flag to allow just one message to be send back with
      # notification that connection should be reestablish
      if not session
        console.warn "could not find session for cookie: ", data.sessionID
        data.reset = true
        data.session = new Session(data, session)
        accept null, true
        # the following should be used to fully deny connection
        # accept("Error", false)
        return

      # Resolve user, could be a locally mocked or from social network
      handler = null
      for h in handlers
        if h.canHandle data
          handler = h
          break

      if not handler
        accept "unauthorized", false
        return

      # pass request object to the handler in order to derive user
      # information
      try
        handler.handle data, (error, profile) ->
          if error
            console.warn "error handling request, error: #{error} handler:", handler
            accept error, false
            return

          # only complete profiels are allowed
          if not profile.uid or not profile.first_name or not profile.last_name or not profile.avatar
            accept "incomplete profile", false
          else
            data.user = profile
            data.session = new Session(data, session)
            accept null, true

      catch error
        console.warn "failed handle request, error: #{error} handler:", handler
        accept "failed handle request", false

  handleConnect: (io, socket, chain) ->
    #TODO: remove? use client side detection?
    # connection is marked as required reload, need notify user only once
    # and close
    if socket.handshake.reset
      socket.emit "app:reload"
      socket.disconnect()
    else
      chain socket
