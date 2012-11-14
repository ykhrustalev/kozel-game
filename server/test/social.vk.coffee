libpath = if process.env.APP_COV then "../lib-cov" else "../lib"
should = require "should"
vk = require "#{libpath}/social/vk"

getMockRequest = (referer) ->
  headers:
    referer: referer

assets =
  valid                 : "http://localhost:3000/?api_url=http://api.vk.com/api.php&api_id=3128240&api_settings=1&viewer_id=52242093&viewer_type=2&sid=b3193ece261311b1d77fd1be9aa9645fe8e313f1013c1492b45ae5d4b31afb&secret=50c81c42ab&access_token=1b342030488ad26418f01f7a4d1806bd2d118291829069c485541646b41dae3a82b408b&user_id=52242093&group_id=0&is_app_user=1&auth_key=c5bfa4e07bf2b73e54f18956fd7e6306&language=0&parent_language=0&ad_info=ElsdCQReQ1FmBQ1YAwJSXHt5BEQ8HTJXUVBBJRVBNwoJFjI2HA8E&api_result=%7B%22response%22%3A%5B%7B%22uid%22%3A52242093%2C%22first_name%22%3A%22%D0%AE%D1%80%D0%B8%D0%B9%22%2C%22last_name%22%3A%22%D0%A5%D1%80%D1%83%D1%81%D1%82%D0%B0%D0%BB%D0%B5%D0%B2%22%2C%22nickname%22%3A%22%22%2C%22domain%22%3A%22yuri.khrustalev%22%2C%22sex%22%3A2%2C%22city%22%3A%2242%22%2C%22country%22%3A%221%22%2C%22timezone%22%3A3%2C%22photo%22%3A%22http%3A%5C%2F%5C%2Fcs407128.userapi.com%5C%2Fu52242093%5C%2Fe_7d1bf0cd.jpg%22%2C%22photo_medium%22%3A%22http%3A%5C%2F%5C%2Fcs407128.userapi.com%5C%2Fu52242093%5C%2Fd_7f63e52a.jpg%22%2C%22photo_big%22%3A%22http%3A%5C%2F%5C%2Fcs407128.userapi.com%5C%2Fu52242093%5C%2Fa_d1732306.jpg%22%2C%22has_mobile%22%3A1%2C%22rate%22%3A%2275%22%2C%22mobile_phone%22%3A%22%22%2C%22home_phone%22%3A%22%22%2C%22university%22%3A452%2C%22university_name%22%3A%22%D0%92%D0%93%D0%A3%5Cr%5Cn%22%2C%22faculty%22%3A5787%2C%22faculty_name%22%3A%22%D0%A4%D0%B8%D0%B7%D0%B8%D1%87%D0%B5%D1%81%D0%BA%D0%B8%D0%B9%22%2C%22graduation%22%3A2009%7D%5D%7D&referrer=user_apps&lc_name=4c1f7a82&hash="
  invalidApiId          : "http://localhost:3000/?api_url=http://api.vk.com/api.php&api_id=13128240&api_settings=1&viewer_id=52242093&viewer_type=2&sid=b3193ece261311b1d77fd1be9aa9645fe8e313f1013c1492b45ae5d4b31afb&secret=50c81c42ab&access_token=1b342030488ad26418f01f7a4d1806bd2d118291829069c485541646b41dae3a82b408b&user_id=52242093&group_id=0&is_app_user=1&auth_key=c5bfa4e07bf2b73e54f18956fd7e6306&language=0&parent_language=0&ad_info=ElsdCQReQ1FmBQ1YAwJSXHt5BEQ8HTJXUVBBJRVBNwoJFjI2HA8E&api_result=%7B%22response%22%3A%5B%7B%22uid%22%3A52242093%2C%22first_name%22%3A%22%D0%AE%D1%80%D0%B8%D0%B9%22%2C%22last_name%22%3A%22%D0%A5%D1%80%D1%83%D1%81%D1%82%D0%B0%D0%BB%D0%B5%D0%B2%22%2C%22nickname%22%3A%22%22%2C%22domain%22%3A%22yuri.khrustalev%22%2C%22sex%22%3A2%2C%22city%22%3A%2242%22%2C%22country%22%3A%221%22%2C%22timezone%22%3A3%2C%22photo%22%3A%22http%3A%5C%2F%5C%2Fcs407128.userapi.com%5C%2Fu52242093%5C%2Fe_7d1bf0cd.jpg%22%2C%22photo_medium%22%3A%22http%3A%5C%2F%5C%2Fcs407128.userapi.com%5C%2Fu52242093%5C%2Fd_7f63e52a.jpg%22%2C%22photo_big%22%3A%22http%3A%5C%2F%5C%2Fcs407128.userapi.com%5C%2Fu52242093%5C%2Fa_d1732306.jpg%22%2C%22has_mobile%22%3A1%2C%22rate%22%3A%2275%22%2C%22mobile_phone%22%3A%22%22%2C%22home_phone%22%3A%22%22%2C%22university%22%3A452%2C%22university_name%22%3A%22%D0%92%D0%93%D0%A3%5Cr%5Cn%22%2C%22faculty%22%3A5787%2C%22faculty_name%22%3A%22%D0%A4%D0%B8%D0%B7%D0%B8%D1%87%D0%B5%D1%81%D0%BA%D0%B8%D0%B9%22%2C%22graduation%22%3A2009%7D%5D%7D&referrer=user_apps&lc_name=4c1f7a82&hash="
  invalidAuthKey        : "http://localhost:3000/?api_url=http://api.vk.com/api.php&api_id=3128240&api_settings=1&viewer_id=52242093&viewer_type=2&sid=b3193ece261311b1d77fd1be9aa9645fe8e313f1013c1492b45ae5d4b31afb&secret=50c81c42ab&access_token=1b342030488ad26418f01f7a4d1806bd2d118291829069c485541646b41dae3a82b408b&user_id=52242093&group_id=0&is_app_user=1&auth_key=1c5bfa4e07bf2b73e54f18956fd7e6306&language=0&parent_language=0&ad_info=ElsdCQReQ1FmBQ1YAwJSXHt5BEQ8HTJXUVBBJRVBNwoJFjI2HA8E&api_result=%7B%22response%22%3A%5B%7B%22uid%22%3A52242093%2C%22first_name%22%3A%22%D0%AE%D1%80%D0%B8%D0%B9%22%2C%22last_name%22%3A%22%D0%A5%D1%80%D1%83%D1%81%D1%82%D0%B0%D0%BB%D0%B5%D0%B2%22%2C%22nickname%22%3A%22%22%2C%22domain%22%3A%22yuri.khrustalev%22%2C%22sex%22%3A2%2C%22city%22%3A%2242%22%2C%22country%22%3A%221%22%2C%22timezone%22%3A3%2C%22photo%22%3A%22http%3A%5C%2F%5C%2Fcs407128.userapi.com%5C%2Fu52242093%5C%2Fe_7d1bf0cd.jpg%22%2C%22photo_medium%22%3A%22http%3A%5C%2F%5C%2Fcs407128.userapi.com%5C%2Fu52242093%5C%2Fd_7f63e52a.jpg%22%2C%22photo_big%22%3A%22http%3A%5C%2F%5C%2Fcs407128.userapi.com%5C%2Fu52242093%5C%2Fa_d1732306.jpg%22%2C%22has_mobile%22%3A1%2C%22rate%22%3A%2275%22%2C%22mobile_phone%22%3A%22%22%2C%22home_phone%22%3A%22%22%2C%22university%22%3A452%2C%22university_name%22%3A%22%D0%92%D0%93%D0%A3%5Cr%5Cn%22%2C%22faculty%22%3A5787%2C%22faculty_name%22%3A%22%D0%A4%D0%B8%D0%B7%D0%B8%D1%87%D0%B5%D1%81%D0%BA%D0%B8%D0%B9%22%2C%22graduation%22%3A2009%7D%5D%7D&referrer=user_apps&lc_name=4c1f7a82&hash="
  invalidMissingViewerId: "http://localhost:3000/?api_url=http://api.vk.com/api.php&api_id=3128240&api_settings=1&viewer_id1=52242093&viewer_type=2&sid=b3193ece261311b1d77fd1be9aa9645fe8e313f1013c1492b45ae5d4b31afb&secret=50c81c42ab&access_token=1b342030488ad26418f01f7a4d1806bd2d118291829069c485541646b41dae3a82b408b&user_id=52242093&group_id=0&is_app_user=1&auth_key=c5bfa4e07bf2b73e54f18956fd7e6306&language=0&parent_language=0&ad_info=ElsdCQReQ1FmBQ1YAwJSXHt5BEQ8HTJXUVBBJRVBNwoJFjI2HA8E&api_result=%7B%22response%22%3A%5B%7B%22uid%22%3A52242093%2C%22first_name%22%3A%22%D0%AE%D1%80%D0%B8%D0%B9%22%2C%22last_name%22%3A%22%D0%A5%D1%80%D1%83%D1%81%D1%82%D0%B0%D0%BB%D0%B5%D0%B2%22%2C%22nickname%22%3A%22%22%2C%22domain%22%3A%22yuri.khrustalev%22%2C%22sex%22%3A2%2C%22city%22%3A%2242%22%2C%22country%22%3A%221%22%2C%22timezone%22%3A3%2C%22photo%22%3A%22http%3A%5C%2F%5C%2Fcs407128.userapi.com%5C%2Fu52242093%5C%2Fe_7d1bf0cd.jpg%22%2C%22photo_medium%22%3A%22http%3A%5C%2F%5C%2Fcs407128.userapi.com%5C%2Fu52242093%5C%2Fd_7f63e52a.jpg%22%2C%22photo_big%22%3A%22http%3A%5C%2F%5C%2Fcs407128.userapi.com%5C%2Fu52242093%5C%2Fa_d1732306.jpg%22%2C%22has_mobile%22%3A1%2C%22rate%22%3A%2275%22%2C%22mobile_phone%22%3A%22%22%2C%22home_phone%22%3A%22%22%2C%22university%22%3A452%2C%22university_name%22%3A%22%D0%92%D0%93%D0%A3%5Cr%5Cn%22%2C%22faculty%22%3A5787%2C%22faculty_name%22%3A%22%D0%A4%D0%B8%D0%B7%D0%B8%D1%87%D0%B5%D1%81%D0%BA%D0%B8%D0%B9%22%2C%22graduation%22%3A2009%7D%5D%7D&referrer=user_apps&lc_name=4c1f7a82&hash="
  missingApiResult      : "http://localhost:3000/?api_url=http://api.vk.com/api.php&api_id=3128240&api_settings=1&viewer_id=52242093&viewer_type=2&sid=b3193ece261311b1d77fd1be9aa9645fe8e313f1013c1492b45ae5d4b31afb&secret=50c81c42ab&access_token=1b342030488ad26418f01f7a4d1806bd2d118291829069c485541646b41dae3a82b408b&user_id=52242093&group_id=0&is_app_user=1&auth_key=c5bfa4e07bf2b73e54f18956fd7e6306&language=0&parent_language=0&ad_info=ElsdCQReQ1FmBQ1YAwJSXHt5BEQ8HTJXUVBBJRVBNwoJFjI2HA8E&api_result1=%7B%22response%22%3A%5B%7B%22uid%22%3A52242093%2C%22first_name%22%3A%22%D0%AE%D1%80%D0%B8%D0%B9%22%2C%22last_name%22%3A%22%D0%A5%D1%80%D1%83%D1%81%D1%82%D0%B0%D0%BB%D0%B5%D0%B2%22%2C%22nickname%22%3A%22%22%2C%22domain%22%3A%22yuri.khrustalev%22%2C%22sex%22%3A2%2C%22city%22%3A%2242%22%2C%22country%22%3A%221%22%2C%22timezone%22%3A3%2C%22photo%22%3A%22http%3A%5C%2F%5C%2Fcs407128.userapi.com%5C%2Fu52242093%5C%2Fe_7d1bf0cd.jpg%22%2C%22photo_medium%22%3A%22http%3A%5C%2F%5C%2Fcs407128.userapi.com%5C%2Fu52242093%5C%2Fd_7f63e52a.jpg%22%2C%22photo_big%22%3A%22http%3A%5C%2F%5C%2Fcs407128.userapi.com%5C%2Fu52242093%5C%2Fa_d1732306.jpg%22%2C%22has_mobile%22%3A1%2C%22rate%22%3A%2275%22%2C%22mobile_phone%22%3A%22%22%2C%22home_phone%22%3A%22%22%2C%22university%22%3A452%2C%22university_name%22%3A%22%D0%92%D0%93%D0%A3%5Cr%5Cn%22%2C%22faculty%22%3A5787%2C%22faculty_name%22%3A%22%D0%A4%D0%B8%D0%B7%D0%B8%D1%87%D0%B5%D1%81%D0%BA%D0%B8%D0%B9%22%2C%22graduation%22%3A2009%7D%5D%7D&referrer=user_apps&lc_name=4c1f7a82&hash="

describe "vk", ->
  describe "handler", ->
    appId = "3128240"
    appSecret = "MPaH8nH7lmyq9hM8LGli"
    handler = vk(appId, appSecret)

    describe "#cantHandle()", ->
      it "should identify request that can be handled", (done) ->
        should.exist handler.canHandle getMockRequest "http://vk.com"
        done()

      it "should identify request that can't be handled", (done) ->
        (handler.canHandle getMockRequest "http://google.com").should.be.false
        (handler.canHandle getMockRequest "").should.be.false
        done()

    describe "#handle()", ->
      it "should handle valid requests", (done) ->
        handler.handle getMockRequest(assets.valid), (error, profile) ->
          should.not.exist error
          should.exist profile
          profile.should.include
            uid       : "vk52242093"
            first_name: "Юрий"
            last_name : "Хрусталев"
            avatar    : "http://cs407128.userapi.com/u52242093/e_7d1bf0cd.jpg"

          profile.avatar.should.match /^http:\/\/[\w\d.\\\/]*jpg$/
          done()

      it "should fail with incorrect apiId", (done) ->
        handler.handle getMockRequest(assets.invalidApiId), (error) ->
          should.exist error
          done()

      it "should fail with incorrect authKey", (done) ->
        handler.handle getMockRequest(assets.invalidAuthKey), (error) ->
          should.exist error
          done()

      it "should fail with missing viewerId", (done) ->
        handler.handle getMockRequest(assets.invalidMissingViewerId), (error) ->
          should.exist error
          done()

      it "should fail with missing api_result", (done) ->
        handler.handle getMockRequest(assets.missingApiResult), (error) ->
          should.exist error
          done()
