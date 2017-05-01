/**
 * Created by admin on 12/5/2015.
 */
var express = require('express'),
    router = express.Router(),
    utils = require('../common/utils'), // 后缀.js可以省略，Node会自动查找，
    netCommon = require('../common/netCommonFunc'),
    status = require('../common/status'),
    fs = require('fs'),
    opusController = require('../db/opus/opusController');

// 定义RESTFull API（路径）中的参数， 形参
router.param('opusID', function (req, res, next, id) {
    next();
});

router.get('/', function(req, res, next) {
    var user = status.getUserInfo(req, res);
    if (!user) {
        return netCommon.invalidOperation(req, res);
    }
    opusController.getList(user, onGotList, onFail);
    function onGotList(list) {
        // console.log(list);
        res.json(list);
    }

    function onFail(msg) {
        console.error("failed in getWcyList" + msg);
    }
});

router.get('/apply/:opusID', function (req, res, next) {
    var user = status.getUserInfo(req, res);
    if (!user) {
        return netCommon.invalidOperation(req, res);
    }
    var opusID = req.params.opusID || 0,
        msg = "received! apply to publish: " + opusID;
    opusController.applyToPublish(opusID, user.ID);
    res.json(msg);
});

router.get('/approve/:opusID', function (req, res, next) {
    var user = status.getUserInfo(req, res);
    if (!user) {
        return netCommon.invalidOperation(req, res);
    }

    var opusID = req.params.opusID || 0,
        msg;

    if (user.canApprove) {
        opusController.approveToPublish(opusID);
        msg = "received! approve, " + opusID;
    } else {
        msg = "not allowed!";
    }
    res.json(msg);
});

router.get('/ban/:opusID', function (req, res, next) {
    var user = status.getUserInfo(req, res);
    if (!user) {
        return netCommon.invalidOperation(req, res);
    }

    var opusID = req.params.opusID || 0,
        msg;

    if (user.canBan) {
        opusController.ban(opusID);
        msg = "received! ban, " + opusID;
    } else {
        msg = "not allowed!";
    }
    res.json(msg);
});

module.exports = router;
