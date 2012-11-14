libpath = if process.env.APP_COV then "../lib-cov" else "../lib"
should = require "should"
handler = require "#{libpath}/social/mock"

getMockRequest = (query) -> query: query

describe "social.mock", ->
  imageRegex = /^.*\.(jpe?g|gif|png)$/g

  describe "#cantHandle()", ->
    it "should identify request that can be handled", (done) ->
      should.exist handler.canHandle getMockRequest "?uid"
      done()

    it "should identify request that can't be handled", (done) ->
      (handler.canHandle getMockRequest "http://google.com").should.be.false
      (handler.canHandle getMockRequest "").should.be.false
      done()

  describe "#handle()", ->
    it "should handle valid requests", (done) ->
      handler.handle getMockRequest("uid=1"), (error, profile) ->
        should.not.exist error
        should.exist profile
        should.exist profile.uid
        should.exist profile.first_name
        should.exist profile.last_name
        should.exist profile.avatar

        profile.avatar.should.match imageRegex
        done()
