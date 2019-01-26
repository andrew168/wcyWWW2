/**
 * Created by Andrewz on 1/26/19.
 * wxmp: 微信miniprogram的接口
 */

var express = require('express');
var router = express.Router();
var https = require('https'),
  configSvr = require('../common/configSvr');

router.get('/', function (req, res, next) {
  onWxmpLoggin(req, res);
});

function onWxmpLoggin(req, res) {
  var appId = configSvr.wx.boneMiniprogram.appId,
    appSecret = configSvr.wx.boneMiniprogram.appSecret,
    wxTempCode = req.body.code,
    boneToken = req.body.boneToken,
    nickname = req.body.nickname;

  if (!wxTempCode) {
    wxTempCode = "";
  }

  if (boneToken) {
    boneToken = '';
  }

  if (nickname) {
    nickname = '匿名微信用户';
  }


  var getOpenIdUrl = 'https://api.weixin.qq.com/sns/jscode2session' +
    '?appid=' + appId + '&secret=' + appSecret + '&js_code=' + wxTempCode + '&grant_type=authorization_code';

  console.log("call wx to convert temp code to openid");
  // !! 注意调用所有微信接口时均需使用https协议
  https.get(getOpenIdUrl, function (response) {
    console.log("Got response: statusCode=" + response.statusCode);
    response.setEncoding('utf8');
    response.on('data', function (data) {
      console.log('raw data in response: ');
      console.log(data);
      var jsonData = JSON.parse(data);
      var wxUserId = (!jsonData.unionId ? jsonData.openId : jsonData.unionId);
      if (!wxUserId || jsonData.errcode) {
        var errorMsg = "error in code2session：" + jsonData.errmsg;
        console.log(errorMsg);
      }
      console.log("get new token.");
      res.send("login from wx: OK!");
    });
  }).on('error', function (e) {
    console.log("Got error: " + e.message);
    res.send("login from wx: failed!");
  });
}

module.exports = router;
