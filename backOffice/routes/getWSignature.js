/**
 * Created by admin on 11/21/2015.
 */
var express = require('express');
var router = express.Router();
var https = require('https');
var utils = require('../common/utils'); // 后缀.js可以省略，Node会自动查找，
var status = require('../common/status');

var createNonceStr = function () {
    return Math.random().toString(36).substr(2, 15);
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
    string = string.substr(1);
    return string;
};

/**
 * @synopsis ǩ���㷨
 *
 * @param jsapi_ticket ����ǩ���� jsapi_ticket
 * @param url ����ǩ���� url ��ע����붯̬��ȡ������ hardcode
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
/*
 jsapi_ticket是公众号用于调用微信JS接口的临时票据。
 有效期为7200秒，（2小时）
 通过access_token来获取。
 */
var jsapiTicket = "bxLdikRXVbTPdHSM05e5u6sMAbQ-4wKaZjQssNrkbxe6fIV1i6BJ_as-MOtj7-2RpuJbwZzotgMS2bjpWeBXzQ";
var jsapiTicketExpireTime = 0;
var accessToken;
var accessTokenExpireTime  = 0;
router.get('/', function(req, res, next) {
    if (isValidJsapiTicket()) {
        responseSign(req, res, next);
    } else {
        getTicket(function() {responseSign(req, res, next);});
    }
});

/// private function:
function responseSign(req, res, next) {
    var url = req.headers.referer || req.headers.origin || req.headers.host;
    if (url.indexOf("http") <0) {
        url = "http://" + url;
    }
    var data = {
        jsapi_ticket: jsapiTicket,
        nonceStr: createNonceStr(),
        timestamp: utils.createTimestamp(),
        url: url
        // tag: 'tag'
    };

    // console.log(req);
    sign(data);  //data.s = signature;
    // res.header("Access-Control-Allow-Origin", "*");
    // res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.json(data);
}

function getTicket(cb) {
    if (isValidAccessToken()) {
        doGetTicket(cb);
    } else {
        getToken(function() {
            doGetTicket(cb);
        })
    }
}

function doGetTicket(cb) {
    var ticketUrl = 'https://api.weixin.qq.com/cgi-bin/ticket/getticket?' +
                    'access_token=' + accessToken + '&type=jsapi';

    https.get(ticketUrl, function(res) {
        console.log('STATUS: ' + res.statusCode);
        console.log('HEADERS: ' + JSON.stringify(res.headers));
        res.setEncoding('utf8');
        res.on('data', function(data) {
            var jsonData = JSON.parse(data);
            if (jsonData.errcode === 0) {
                jsapiTicket = jsonData.ticket;
                jsapiTicketExpireTime = (jsonData.expires_in - 20) * 1000 + (new Date()).getTime();
                console.log("get new ticket");
            } else {
                console.log("Unknow error in doGetTicket: " + data);
            }
            cb();
        });
    }).on('error', function(e) {
        console.log("error in doGetTicket: " + e.message);
        cb();
    });
}

function getToken(cb) {
    var appID = "wx9a9eb662dd97612f",
        appSecret = "7375b13e9c859d48b71a6097790d8358";

    var getTokenUrl = 'https://api.weixin.qq.com/cgi-bin/token?' +
        'grant_type=client_credential' +
        '&appid=' + appID + '&secret=' + appSecret;

    // !! 注意调用所有微信接口时均需使用https协议
    https.get(getTokenUrl, function(res) {
        console.log("Got response: " + res.statusCode);
        // console.log("Got response: " + res);
        res.setEncoding('utf8');
        res.on('data', function(data) {
            console.log(data);
            var jsonData = JSON.parse(data);
            accessToken = jsonData.access_token;
            accessTokenExpireTime = (jsonData.expires_in - 10) * 1000 + (new Date()).getTime();
            console.log("get new token.");
            cb();
        });
    }).on('error', function(e) {
        console.log("Got error: " + e.message);
        cb();
    });
}

function isValidJsapiTicket() {
    return ((new Date()).getTime() < jsapiTicketExpireTime);
}

function isValidAccessToken() {
    return ((new Date()).getTime() < accessTokenExpireTime);
}

module.exports = router;
