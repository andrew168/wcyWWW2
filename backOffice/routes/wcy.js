/**
 * Created by admin on 12/5/2015.
 */
var express = require('express'),
    router = express.Router(),
    utils = require('../common/utils'), // 后缀.js可以省略，Node会自动查找，
    imageUtils = require('../common/imageUtils'), // 后缀.js可以省略，Node会自动查找，
    status = require('../common/status'),
    netCommon = require('../common/netCommonFunc'),
    fs = require('fs'),
    opusController = require('../db/opus/opusController'),
    cSignature = require('../common/cloundarySignature'), // 后缀.js可以省略，Node会自动查找，
    authHelper = require('./authHelper'),

    WCY_DEPOT = "/data/wcydepot/";

var defaultWcyData = '{"levels":[{"latestElement":null,"tMaxFrame":200,"t0":0,"resourceReady":true,"elements":[],"FPS":20,"_t":0,"name":"0","itemCounter":0,"dataReady":true,"state":5,"isWaitingForShow":false,"dirtyZ":false,"isDirty":false,"hasSentToRM":true}],"version":"V2","isDirty":false,"filename":"wcy01","title":"wcy01","currentLevelId":0,"alias":"gameScene","remote":true,"isPreloading":false,"overlay":{"elements":[],"FPS":20,"tMaxFrame":200,"_t":0,"name":"overlay","itemCounter":0,"dataReady":true,"state":5,"isWaitingForShow":false,"dirtyZ":false,"isDirty":false},"currentLevel":{"latestElement":null,"tMaxFrame":200,"t0":0,"resourceReady":true,"elements":[],"FPS":20,"_t":0,"name":"0","itemCounter":0,"dataReady":true,"state":5,"isWaitingForShow":false,"dirtyZ":false,"isDirty":false,"hasSentToRM":true},"stage":null}';

// 定义RESTFull API（路径）中的参数， 形参
router.param('shareCode', function (req, res, next, id) {
    next();
});

router.get('/:shareCode', function(req, res, next) {
    var shareCode = req.params.shareCode || 0;
    console.log("shareCode =", shareCode);
    var wcyId = utils.decomposeShareCode(shareCode).wcyId;
    sendBackWcy(req, res, wcyId);
});

router.post('/', authHelper.ensureAuthenticated, function(req, res, next) {
    var userId = req.user,
        user = (!userId) ? null: status.getUserInfoById(userId);
    if (!user) {
        return netCommon.notLogin(req, res);
    }

    console.log("params: " + JSON.stringify(req.params));
    console.log("body: " + JSON.stringify(req.body));
    console.log("query: " + JSON.stringify(req.query));
        //ToDo:@@@
        var templateID = 0,
            wcyDataObj = req.body,
            wcyData = JSON.stringify(wcyDataObj),
            ssPath = (!wcyDataObj.ssPath) ? null : wcyDataObj.ssPath;

        if (!wcyData) {
            var msg = "wrong format: must have wcyId, and wcyData!";
            console.log(msg);
            res.send(msg);
        } else {
            var wcyId = req.query.wcyId || 0;
            if (isNewWcy(wcyId)) { // 新作品，
                // 入库， 并获取新wcyID，
                function onSavedToDB(_wcyId, ssPath) {
                    wcyId = _wcyId;
                    _saveWcy(req, res, user, wcyId, ssPath, wcyData);
                }
                opusController.add(user.ID, ssPath, templateID, onSavedToDB, null);
            } else {
                opusController.updateScreenshot(user.ID, wcyId, ssPath, onSavedToDB);
            }
        }
});

function _saveWcy(req, res, user, wcyId, ssPath, wcyData) {
    fs.writeFile(wcyId2Filename(wcyId), wcyData, onWriteCompleted);
    function onWriteCompleted(err) {
        var msg;
        if(err) {
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
    var shareId = 0,
        shareCode = utils.composeShareCode(shareId, wcyId, user.ID);
    if (!user) {
        return netCommon.notLogin(req, res);
    }

    // ssPath可能为null，(如果本次没有截屏的话）
    var data = {
        public_id: imageUtils.screenshotId2Name(wcyId)
    };
    cSignature.sign(data);
    res.send({wcyId: wcyId, ssPath: ssPath, ssSign: data, shareCode:shareCode, msg:msg});
}

/// private function:
function response(req, res, data, wcyId, authorData) {
    var user = status.getUserInfo(req, res),
        userID = (!user) ? 0 : user.ID,
        url = req.headers.origin,
    // var url = req.headers.referer;
        shareId = 0,
        shareCode = utils.composeShareCode(shareId, wcyId, userID);

    var data = {
        timestamp: utils.createTimestamp(),
        url: 'url' + url,
        referer: 'url' + req.headers.referer,
        timesCalled: status.timesCalled,
        wcyId: wcyId,
        shareCode: shareCode,
        userID: userID,
        authorID: authorData.ID,
        isPlayOnly: (userID !== authorData.ID),
        data: data
    };

    // console.log(req);
    res.json(data);
}

function wcyId2Filename(wcyId) {
    if (typeof wcyId != "number") {
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
        dataReady,
        authorData,
        error = null,
        wcyData = null,
        user;

    // status.checkUser(req, res, onUserReady);
    opusController.getAuthor(wcyId, onGotAuthorData);
    fs.readFile(wcyId2Filename(wcyId), 'utf8', onDataReady);
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

    //function onUserReady() {
    //    user = status.getUserInfo(req, res);
    //    userReady = true;
    //    if (userReady && dataReady && authorData) {
    //        doSendBackWcy(error, wcyData);
    //    }
    //}

    function doSendBackWcy(err, data) {
        if (err) {
            console.log("找不到作品文件，wcyId = " + wcyId);
            data = defaultWcyData;
        }

        // if (user && user.isRegistered) {
            response(req, res, data, wcyId, authorData);
        //} else {
        //    response(req, res, data, wcyId, authorData);
        //    console.log("对于非注册用户， 如何处理？");
        //}
    }
}

// private functions:
function isNewWcy(wcyId) {
    return ((wcyId === '0') || (wcyId === '-1'));
}

module.exports = router;
