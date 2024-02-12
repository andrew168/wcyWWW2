/**
 * Created by admin on 12/5/2015.
 */
var express = require("express");
var fbPageTemplate = require("./fbPageTemplate");
var router = express.Router();
var utils = require("../common/utils"); // 后缀.js可以省略，Node会自动查找，
var imageUtils = require("../common/imageUtils"); // 后缀.js可以省略，Node会自动查找，
var status = require("../common/status");
var netCommon = require("../common/netCommonFunc");
var fs = require("fs");
var serverConfig = require("./../bin/serverConfig");
var opusController = require("../db/opus/opusController");
var cSignature = require("../common/cloundarySignature"); // 后缀.js可以省略，Node会自动查找，
var authHelper = require("./authHelper");
var WCY_DEPOT = "/data/wcydepot/";
var FB_PAGE_DEPOT = "/data/wwwz/card2/www/opus";
var FB_PAGE_ROOT = "http://www.udoido.cn/opus"; // fs的当前目录是服务器的根目录

var defaultWcyData = "{\"levels\":[{\"latestElement\":null,\"tMaxFrame\":200,\"t0\":0,\"resourceReady\":true,\"elements\":[],\"FPS\":20,\"_t\":0,\"name\":\"0\",\"itemCounter\":0,\"dataReady\":true,\"state\":5,\"isWaitingForShow\":false,\"dirtyZ\":false,\"isDirty\":false,\"hasSentToRM\":true}],\"version\":\"V2\",\"isDirty\":false,\"filename\":\"wcy01\",\"title\":\"wcy01\",\"currentLevelId\":0,\"alias\":\"gameScene\",\"remote\":true,\"isPreloading\":false,\"overlay\":{\"elements\":[],\"FPS\":20,\"tMaxFrame\":200,\"_t\":0,\"name\":\"overlay\",\"itemCounter\":0,\"dataReady\":true,\"state\":5,\"isWaitingForShow\":false,\"dirtyZ\":false,\"isDirty\":false},\"currentLevel\":{\"latestElement\":null,\"tMaxFrame\":200,\"t0\":0,\"resourceReady\":true,\"elements\":[],\"FPS\":20,\"_t\":0,\"name\":\"0\",\"itemCounter\":0,\"dataReady\":true,\"state\":5,\"isWaitingForShow\":false,\"dirtyZ\":false,\"isDirty\":false,\"hasSentToRM\":true},\"stage\":null}";
if (serverConfig.isDevEnv) {
  FB_PAGE_DEPOT = "../www/opus";
}
// 定义RESTFull API（路径）中的参数， 形参
router.param("shareCode", function(req, res, next, id) {
  next();
});

router.get("/:shareCode", function(req, res) {
  var shareCode = req.params.shareCode || 0;
  console.log("shareCode =", shareCode);
  var wcyId = utils.decomposeShareCode(shareCode).wcyId;
  sendBackWcy(req, res, wcyId);
});

router.post("/", authHelper.ensureAuthenticated, function(req, res) {
  var userId = req.userId;// 这是ensureAuthenticated写入的
  if (!userId) { // 没有authentication信息， 在getUserId中已经response了
    return;
  }
  var user = (!userId) ? null : status.getUserInfoByTokenId(req.tokenId, userId);
  if (!user) {
    return netCommon.notLogin(req, res);
  }

  var shareCode = req.params.shareCode || 0;
  if (shareCode) {
    return shareToFB(shareCode, req, res);
  }

  console.log("params: " + JSON.stringify(req.params));
  // console.log("body: " + JSON.stringify(req.body));
  console.log("query: " + JSON.stringify(req.query));
  // ToDo:@@@
  var templateId = 0;
  var wcyDataObj = req.body;
  var wcyData = JSON.stringify(wcyDataObj);
  var ssPath = (!wcyDataObj.ssPath) ? null : wcyDataObj.ssPath;

  if (!wcyData) {
    var msg = "wrong format: must have wcyId, and wcyData!";
    console.log(msg);
    res.send(msg);
  } else {
    var wcyId = req.query.wcyId || 0;
    // 入库， 并获取新wcyID，
    var onSavedToDb = function fn(_wcyId, ssPath) {
      const wcyId = _wcyId;
      _saveWcy(req, res, user, wcyId, ssPath, wcyData);
    };

    if (isNewWcy(wcyId)) { // 新作品，
      opusController.add(user, ssPath, templateId, wcyDataObj, onSavedToDb, null);
    } else {
      opusController.updateScreenshot(user.ID, wcyId, ssPath, onSavedToDb);
    }
  }
});

router.post("/:shareCode", authHelper.ensureAuthenticated, function(req, res) {
  var userId = req.userId;// 这是ensureAuthenticated写入的
  if (!userId) { // 没有authentication信息， 在getUserId中已经response了
    return;
  }
  var user = (!userId) ? null : status.getUserInfoByTokenId(req.tokenId, userId);
  var shareCode = req.params.shareCode || 0;

  if (!user || !shareCode) {
    return netCommon.notLogin(req, res);
  }
  return shareToFB(shareCode, req, res);
});

function _saveWcy(req, res, user, wcyId, ssPath, wcyData) {
  fs.writeFile(wcyId2Filename(wcyId), wcyData, onWriteCompleted);
  function onWriteCompleted(err) {
    var msg;
    if (err) {
      msg = err;
      return console.log(err);
    } else {
      msg = "The file was saved!";
    }
    console.log(msg);
    resWcySaved(req, res, user, wcyId, ssPath, msg);
  }
}

function resWcySaved(req, res, user, wcyId, ssPath, msg) {
  var shareId = 0;
  var shareCode = utils.composeShareCode(shareId, wcyId, user.ID);
  if (!user) {
    return netCommon.notLogin(req, res);
  }

  // ssPath可能为null，(如果本次没有截屏的话）
  var data = {
    public_id: imageUtils.screenshotId2Name(wcyId)
  };
  cSignature.sign(data);
  res.send({ wcyId: wcyId, ssPath: ssPath, ssSign: data, shareCode: shareCode, msg: msg });
}

// / private function:
function response(req, res, data, wcyId, authorData) {
  var user = authHelper.hasAuthInfo(req) ? status.getUserInfo2(req, res) : null;
  var userId = (!user) ? 0 : user.ID;
  var url = req.headers.origin;
  // var url = req.headers.referer;
  var shareId = 0;
  var shareCode = utils.composeShareCode(shareId, wcyId, userId);

  var dataPackage = {
    timestamp: utils.createTimestamp(),
    url: "url" + url,
    referer: "url" + req.headers.referer,
    timesCalled: status.timesCalled,
    wcyId: wcyId,
    shareCode: shareCode,
    userId: userId,
    authorId: authorData.ID,
    isPlayOnly: (userId !== authorData.ID),
    data: data
  };

  // console.log(req);
  res.json(dataPackage);
}

function wcyId2Filename(wcyId) {
  if (typeof wcyId !== "number") {
    wcyId = parseFloat(wcyId);
  }
  return WCY_DEPOT + wcyId + ".wcy";
}

function filename2WcyId(filename) {
  var rootLen = WCY_DEPOT.length;
  return parseInt(filename.substr(rootLen, filename.length - 4 - rootLen));
}

function sendBackWcy(req, res, wcyId) {
  var // userReady = false,
    dataReady;
  var authorData;
  var error = null;
  var wcyData = null;
  var user;

  opusController.getAuthor(wcyId, onGotAuthorData);
  fs.readFile(wcyId2Filename(wcyId), "utf8", onDataReady);
  function onGotAuthorData(data) {
    authorData = data;
    if (dataReady && authorData) {
      doSendBackWcy(error, wcyData);
    }
  }

  function onDataReady(err, data) {
    dataReady = true;
    error = err;
    wcyData = data;
    if (dataReady && authorData) {
      doSendBackWcy(error, wcyData);
    }
  }

  // function onUserReady() {
  //    user = status.getUserInfo(req, res);
  //    userReady = true;
  //    if (userReady && dataReady && authorData) {
  //        doSendBackWcy(error, wcyData);
  //    }
  // }

  function doSendBackWcy(err, data) {
    if (err) {
      console.log("找不到作品文件，wcyId = " + wcyId);
      data = defaultWcyData;
    }

    // if (user && user.isRegistered) {
    response(req, res, data, wcyId, authorData);
    // } else {
    //    response(req, res, data, wcyId, authorData);
    //    console.log("对于非注册用户， 如何处理？");
    // }
  }
}

function shareToFB(shareCode, req, res) {
  var pageShortPath = "/" + shareCode + ".html";
  var pageFileName = FB_PAGE_DEPOT + pageShortPath;
  var pageUrl = FB_PAGE_ROOT + pageShortPath;
  var spaUrl = "http://www.udoido.com/#/do?sc=" + shareCode; // single page app url
  var shareData = {
    imageUrl: req.body.ssPath || null,
    title: req.body.title || null,
    description: req.body.description || null
  };
  var fbPage;

  fbPage = fbPageTemplate.createPage(pageUrl, shareData);

  fs.writeFile(pageFileName, fbPage, onWriteCompleted);
  function onWriteCompleted(err) {
    var msg;
    if (err) {
      msg = err.toString() + "in " + shareCode;
    } else {
      msg = shareCode + ": The page created!";
    }

    console.log(msg);
    res.send({ msg: msg });
  }
}

// private functions:
function isNewWcy(wcyId) {
  return ((wcyId === "0") || (wcyId === "-1"));
}

module.exports = router;
