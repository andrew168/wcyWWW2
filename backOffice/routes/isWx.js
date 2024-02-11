
/**
 * Created by Andrewz on 5/13/2016.
 */
var express = require("express");
var router = express.Router();
var configSvr = require("../common/configSvr");
var shaAdapter = require("../common/sha-adapter");

/* GET users listing. */
router.get("/", function(req, res, next) {
  responseSign(req, res, next);
});

// / private function:
function responseSign(req, res, next) {
  var timestamp = req.query.timestamp;
  var nonce = req.query.nonce;
  var token = configSvr.wx.bindToken;
  var data = [token, timestamp, nonce];
  var result = "not match";
  var sig = _createSha1(data); // data.s = signature;

  console.log("input: " + JSON.stringify(data));
  if (sig === req.query.signature) {
    result = req.query.echostr;
  }

  res.send(result);
}

var _createSha1 = function(params) {
  params.sort();
  var rawData = params.join("");
  return shaAdapter.getShaHash(rawData);
};

module.exports = router;
