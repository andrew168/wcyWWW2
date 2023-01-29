/**
 * Created by Andrewz on 1/26/19.
 * wxmp: 微信miniprogram的接口, 只是从微信小程序中上传到服务器， 尚未利用。
 */

var express = require('express');
var router = express.Router();
var https = require('https'),
  Const = require('../base/const'),
  onlineWxUsers = require('../common/onlineWxUsers'),
  configSvr = require('../common/configSvr');

router.get('/', function (req, res, next) {
  onWxmpLoggin(req, res);
});

function onWxmpLoggin(req, res) {
  var appId = configSvr.wx.boneMiniprogram.appId,
    appSecret = configSvr.wx.boneMiniprogram.appSecret,
    wxCode = req.body.code || req.query.code,
    nickName = req.body.nickName || req.query.nickName;
  if (!wxCode) {
    wxCode = "";
  }

  if (!nickName) {
    nickName = Const.DEFAULT_WX_GUEST_NAME;
  }

  var getOpenIdUrl = 'https://api.weixin.qq.com/sns/jscode2session' +
    '?appid=' + appId + '&secret=' + appSecret + '&js_code=' + wxCode + '&grant_type=authorization_code';

  console.log("call wx to convert temp code to openid");
  // !! 注意调用所有微信接口时均需使用https协议
  https.get(getOpenIdUrl, function (response) {
    console.log("Got response: statusCode=" + response.statusCode);
    response.setEncoding('utf8');
    response.on('data', function (data) {
      console.log('raw data in response: ');
      console.log(data);
      var jsonData = JSON.parse(data);
      var wxOpenId = (!jsonData.unionid ? jsonData.openid : jsonData.unionid);
      if (!wxOpenId || jsonData.errcode) {
        wxOpenId = 'OpenIdF' + nickName;
        var errorMsg = "error in code2session：" + jsonData.errmsg;
        console.log(errorMsg);
        res.send("login from wx: failed! detail: " + errorMsg);
      } else {
        console.log("linked code to userID, 用户可以用code找到userID");
        res.send("login from wx: OK!");
      }

      if (wxCode && wxOpenId && nickName) {
        onlineWxUsers.addWxOpenId(wxOpenId, nickName, wxCode);
      }
    });
  }).on('error', function (e) {
    console.log("Got error: " + e.message);
    res.send("login from wx: failed!");
  });
}

module.exports = router;
