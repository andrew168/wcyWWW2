/**
 * Created by Andrewz on 1/11/2016.
 */
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

    var rawString = '';
    for (var k in newArgs) {
        rawString += '&' + k + '=' + newArgs[k];
    }
    rawString = rawString.substr(1) +"dwwKQ0MPL40ttMSR6SoMH-E1Jrw";
    return rawString;
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
    if (!ret.timestamp) {
        ret.timestamp = createTimestamp();
    }
    var rawString = raw(ret);
    jsSHA = require('jssha');
    shaObj = new jsSHA(rawString, 'TEXT');
    ret.signature = shaObj.getHash('SHA-1', 'HEX');

    return ret;
};

exports.sign = sign;
