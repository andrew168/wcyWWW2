/**
 * Created by Andrewz on 1/11/2016.
 */
var utils = require('../common/utils'); // 后缀.js可以省略，Node会自动查找，

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
        ret.timestamp = utils.createTimestamp();
    }
    var rawString = raw(ret);
    jsSHA = require('jssha');
    shaObj = new jsSHA('SHA-1', 'TEXT', { encoding: "UTF8" });
    shaObj.update(rawString);
    ret.signature = shaObj.getHash('HEX');
    return ret;
};

exports.sign = sign;
