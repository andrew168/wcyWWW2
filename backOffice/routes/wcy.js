/**
 * Created by admin on 12/5/2015.
 */
var express = require('express');
var router = express.Router();
var utils = require('../common/utils'); // 后缀.js可以省略，Node会自动查找，
var fs = require('fs');

var userController = require('../db/user/user-controller');
var opusController = require('../db/opus/opus-controller');

var userID,
    timesCalled,
    defaultUserID = 1000;

router.param('shareCode', function (req, res, next, id) {
    console.log('CALLED ONLY ONCE');
    next();
});

router.get('/:shareCode', function(req, res, next) {
    timesCalled = getCookie(req, 'timesCalled', 0);
    timesCalled ++;
    checkUserID(req);
    var shareCode = req.param('shareCode');
    var wcyId = utils.decomposeShareCode(shareCode).wcyId;
    sendBackWcy(res, wcyId);
});

router.post('/', function(req, res, next) {
    console.log("params: " + JSON.stringify(req.params));
    console.log("body: " + JSON.stringify(req.body));
    console.log("query: " + JSON.stringify(req.query));
    //ToDo:@@@
    var userID = 0;
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
            function onSavedToDB(_wcyId) {
                wcyId = _wcyId;
                _saveWcy(wcyId, wcyData, res);
            }
            opusController.add(userID, templateID, onSavedToDB, null);
        } else {
            _saveWcy(wcyId, wcyData, res);
        }
    }
});

function _saveWcy(wcyId, wcyData, res) {
    fs.writeFile(wcyId2Filename(wcyId), wcyData, function(err) {
        var msg;
        if(err) {
            msg = err;
            return console.log(err);
        } else {
            msg = "The file was saved!";
        }
        console.log(msg);
        res.send({wcyId: wcyId, msg:msg});
    });
}

function checkUserID(req) {
    userID = getCookie(req, 'userID', defaultUserID);
    if (userID === defaultUserID) {
  //        userController.addDirect(req);
    }
}

/// private function:
function response(req, res, next) {
    var url = req.headers.origin;
    // var url = req.headers.referer;
    var data = {
        timestamp: utils.createTimestamp(),
        url: 'url' + url,
        referer: 'url' + req.headers.referer,
        timesCalled: timesCalled
    };

    res.cookie('userID', userID.toString(), { maxAge: 900000, httpOnly: true });
    res.cookie('timesCalled', timesCalled.toString(), { maxAge: 900000, httpOnly: true });
    console.log(req);
    res.json(data);
}

function getCookie(req, name, defaultValue)
{
    var para;
    if (!req.cookies[name]) {
        para = defaultValue;
    } else {
        para = req.cookies[name];
        para = parseInt(para);
    }

    return para;
}

var createTimestamp = function () {
    return parseInt(new Date().getTime() / 1000) + '';
};

var WCY_DEPOT = "d:/wcyDepot/";
function wcyId2Filename(wcyId) {
    return WCY_DEPOT + wcyId + ".wcy";
}

function filename2WcyId(filename) {
    var rootLen = WCY_DEPOT.length;
    return parseInt(filename.substr(rootLen, filename.length - 4 - rootLen));
}

function sendBackWcy(res, wcyId) {
    fs.readFile(wcyId2Filename(wcyId), 'utf8', function (err, data) {
        if (err) throw err;
        console.log(data);
        res.json(data);
    });
}

// private functions:
function isNewWcy(wcyId) {
    return (wcyId === '0');
}

module.exports = router;
