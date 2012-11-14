libpath = if process.env.APP_COV then "../lib-cov" else "../lib"
should = require "should"
auth = require "#{libpath}/handlers/auth"

mockRequest = (query, refferer, coockies) ->
  headers:
    refferer: refferer
    coockies: coockies
  query  : query

describe "handlers.auth", ->
  describe "#authorize()", ->
    #TODO: completeme
