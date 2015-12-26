/**
 * Created by admin on 11/21/2015.
 */
var express = require('express');
var router = express.Router();

var createNonceStr = function () {
    return Math.random().toString(36).substr(2, 15);
};

var createTimestamp = function () {
    return parseInt(new Date().getTime() / 1000) + '';
};

var raw = function (args) {
    var keys = Object.keys(args);
    keys = keys.sort();
    var newArgs = {};
    keys.forEach(function (key) {
        newArgs[key.toLowerCase()] = args[key];
    });

    var string = '';
    for (var k in newArgs) {
        string += '&' + k + '=' + newArgs[k];
    }
    string = string.substr(1) +"dwwKQ0MPL40ttMSR6SoMH-E1Jrw";
    return string;
};

/**
 * @synopsis 签名算法
 *
 * @param jsapi_ticket 用于签名的 jsapi_ticket
 * @param url 用于签名的 url ，注意必须动态获取，不能 hardcode
 *
 * @returns
 */
var sign = function (ret) {
    var string = raw(ret);
    jsSHA = require('jssha');
    shaObj = new jsSHA(string, 'TEXT');
    ret.signature = shaObj.getHash('SHA-1', 'HEX');

    return ret;
};

// module.exports = sign;

var app = require('../app');
/* GET users listing. */
router.get('/', function(req, res, next) {
    var data = {
//        nonceStr: createNonceStr(),
        timestamp: createTimestamp(),
        public_id: req.query.filename || "no_filename"
        // tag: 'tag'
    };

    sign(data);  //data.s = signature;
//     res.send('sign = '+ sign);

    console.log(req);
    // app.set('json spaces', 4);
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

    res.json(data);
});

module.exports = router;
