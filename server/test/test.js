var assert = require("assert");
var libpath = process.env['EXAMPLE_COV'] ? '../lib-cov' : '../lib';
var vk = require(libpath + "/social/vk")();

describe('Array', function () {
  describe('#indexOf()', function () {
    it('should return -1 when the value is not present', function () {
      vk.canHandle({headers: {
        referer: "sd"
      }});
      assert.equal(-1, [1, 2, 3].indexOf(5));
      assert.equal(-1, [1, 2, 3].indexOf(0));
    })
  })
})
