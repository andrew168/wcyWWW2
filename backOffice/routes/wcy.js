/**
 * Created by admin on 12/5/2015.
 */
var express = require('express');
var router = express.Router();
var utils = require('../common/utils'); // 后缀.js可以省略，Node会自动查找，
var status = require('../common/status');
var fs = require('fs');

var userController = require('../db/user/userController');
var opusController = require('../db/opus/opusController');

var WCY_DEPOT = "/data/wcydepot/";

router.param('shareCode', function (req, res, next, id) {
    console.log('CALLED ONLY ONCE');
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
            function onSavedToDB(_wcyId) {
                wcyId = _wcyId;
                _saveWcy(wcyId, wcyData, res);
            }
            opusController.add(status.user.ID, templateID, onSavedToDB, null);
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
        var shareId = 0,
            timestamp = (new Date()).getTime();
        var shareCode = utils.composeShareCode(shareId, wcyId, status.user.ID, timestamp);
        res.send({wcyId: wcyId, shareCode:shareCode, msg:msg});
    });
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
    fs.readFile(wcyId2Filename(wcyId), 'utf8', function (err, data) {
        if (err) throw err;
        // console.log(data);
        // res.json(data);
        if (res.isRegisteredUser) {
            response(req, res, data, wcyId);
        } else {
            response(req, res, data, wcyId);
            console.log("对于非注册用户， 如何处理？");

/*          status.setExtraCallback(function() {
                response(req, res, data, wcyId);
            })
*/
        }
    });
}

// private functions:
function isNewWcy(wcyId) {
    return ((wcyId === '0') || (wcyId === '-1'));
}

module.exports = router;
