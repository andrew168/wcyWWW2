/**
 * Created by admin on 12/5/2015.
 */
var express = require('express');
var router = express.Router();
var utils = require('../common/utils'); // 后缀.js可以省略，Node会自动查找，
var imageUtils = require('../common/imageUtils'); // 后缀.js可以省略，Node会自动查找，
var status = require('../common/status');
var fs = require('fs');
var opusController = require('../db/opus/opusController');
var cSignature = require('../common/cloundarySignature'); // 后缀.js可以省略，Node会自动查找，

var WCY_DEPOT = "/data/wcydepot/";

var defaultWcyData = '{"levels":[{"latestElement":null,"tMaxFrame":200,"t0":0,"resourceReady":true,"elements":[],"FPS":20,"_t":0,"name":"0","itemCounter":0,"dataReady":true,"state":5,"isWaitingForShow":false,"dirtyZ":false,"isDirty":false,"hasSentToRM":true}],"version":"V2","isDirty":false,"filename":"wcy01","title":"wcy01","currentLevelId":0,"alias":"gameScene","remote":true,"isPreloading":false,"overlay":{"elements":[],"FPS":20,"tMaxFrame":200,"_t":0,"name":"overlay","itemCounter":0,"dataReady":true,"state":5,"isWaitingForShow":false,"dirtyZ":false,"isDirty":false},"currentLevel":{"latestElement":null,"tMaxFrame":200,"t0":0,"resourceReady":true,"elements":[],"FPS":20,"_t":0,"name":"0","itemCounter":0,"dataReady":true,"state":5,"isWaitingForShow":false,"dirtyZ":false,"isDirty":false,"hasSentToRM":true},"stage":null}';
router.get('/sspath', function(req, res, next) {
    var wcyId = req.param('wcyId');
    resWcySaved(res, wcyId, null, "ssId is generated!");
});

router.get('/list', function(req, res, next) {
    status.checkUser(req, res);
    opusController.getList(status.user.ID, function(data) {
        res.json(data);
    })
});

// 定义RESTFull API（路径）中的参数， 形参
router.param('shareCode', function (req, res, next, id) {
    next();
});

router.get('/:shareCode', function(req, res, next) {
    var shareCode = req.param('shareCode');
    var wcyId = utils.decomposeShareCode(shareCode).wcyId;
    sendBackWcy(req, res, wcyId);
});

router.post('/', function(req, res, next) {
    status.checkUser(req, res);
    console.log("params: " + JSON.stringify(req.params));
    console.log("body: " + JSON.stringify(req.body));
    console.log("query: " + JSON.stringify(req.query));
    //ToDo:@@@
    var templateID = 0;

    var wcyData = JSON.stringify(req.body);
    if (!wcyData) {
        var msg = "wrong format: must have wcyId, and wcyData!";
        console.log(msg);
        res.send(msg);
    } else {
        var wcyId = req.param('wcyId');
        if (isNewWcy(wcyId)) {
            // 入库， 并获取新wcyID，
            function onSavedToDB(_wcyId, ssPath) {
                wcyId = _wcyId;
                _saveWcy(wcyId, ssPath, wcyData, res);
            }
            opusController.add(status.user.ID, templateID, onSavedToDB, null);
        } else {
            var ssPath = null;
            _saveWcy(wcyId, ssPath, wcyData, res);
        }
    }
});

router.post('/sspath', function(req, res, next) {
    var wcyId = req.param('wcyId') || null;
    var ssPath = req.param('ssPath') || null;
    opusController.updateScreenshot(wcyId, ssPath, onUpdated);
    function onUpdated(wcyId, ssPath) {
        resWcySaved(res, wcyId, ssPath, "ssPath updated!");
    }
});

function _saveWcy(wcyId, ssPath, wcyData, res) {
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
        resWcySaved(res, wcyId, ssPath, msg);
    }
}

function resWcySaved(res, wcyId, ssPath, msg) {
    var shareId = 0,
        timestamp = (new Date()).getTime();
    var shareCode = utils.composeShareCode(shareId, wcyId, status.user.ID, timestamp);
    // ssPath可能为null，(如果本次没有截屏的话）
    var data = {
        public_id: imageUtils.screenshotId2Name(wcyId)
    };
    cSignature.sign(data);
    res.send({wcyId: wcyId, ssPath: ssPath, ssSign: data, shareCode:shareCode, msg:msg});
}

/// private function:
function response(req, res, data, wcyId) {
    var url = req.headers.origin;
    // var url = req.headers.referer;
    var data = {
        timestamp: utils.createTimestamp(),
        url: 'url' + url,
        referer: 'url' + req.headers.referer,
        timesCalled: status.timesCalled,
        wcyId: wcyId,
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
    var userReady = false,
        error = null,
        wcyData = null;
    status.checkUser(req, res, onUserReady);
    fs.readFile(wcyId2Filename(wcyId), 'utf8', onDataReady);
    function onDataReady(err, data) {
        if (userReady) {
            onCompleted(err, data);
        } else {
            error = err;
            wcyData = data;
        }
    }

    function onUserReady() {
        userReady = true;
        if (wcyData) {
            onCompleted(error, wcyData);
        }
    }

    function onCompleted(err, data) {
        if (err) {
            console.log("找不到作品文件，wcyId = " + wcyId);
            data = defaultWcyData;
        }

        if (res.isRegisteredUser) {
            response(req, res, data, wcyId);
        } else {
            response(req, res, data, wcyId);
            console.log("对于非注册用户， 如何处理？");
        }
    }
}

// private functions:
function isNewWcy(wcyId) {
    return ((wcyId === '0') || (wcyId === '-1'));
}

module.exports = router;
