
/**
 * Created by Andrewz on 5/13/2016.
 */
var express = require('express');
var router = express.Router();
var configSvr = require('../common/configSvr');

// config
var _token = "tuqiangkeji1111";

/* GET users listing. */
router.get('/', function(req, res, next) {
    responseSign(req, res, next);
});

/// private function:
function responseSign(req, res, next) {
    var timestamp = req.query.timestamp,
        nonce = req.query.nonce,
        token = configSvr.wx.bindToken,
        data = [token, timestamp, nonce],
        result = "not match",
        sig = _createSha1(data);  //data.s = signature;

    console.log("input: " + JSON.stringify(data));
    if (sig === req.query.signature) {
        result = req.query.echostr;
    }

    res.send(result);
}

var _createSha1 = function (params) {
    params.sort();
    rawData = params.join("");
    jsSHA = require('jssha');
    shaObj = new jsSHA(rawData, 'TEXT');
    return signature = shaObj.getHash('SHA-1', 'HEX');
};

module.exports = router;