/**
 * Created by admin on 12/5/2015.
 */
var express = require('express'),
    router = express.Router(),
    utils = require('../common/utils'), // 后缀.js可以省略，Node会自动查找，
    netCommon = require('../common/netCommonFunc'),
    status = require('../common/status'),
    fs = require('fs'),
    authHelper = require('./authHelper'),
    opusController = require('../db/opus/opusController');

// 定义RESTFull API（路径）中的参数， 形参
router.param('opusId', function (req, res, next, id) {
    next();
});

router.get('/', authHelper.ensureAuthenticated, function(req, res, next) {
    var user = status.getUserInfo2(req, res);
    if (!user) {
        return netCommon.notLogin(req, res);
    }
    opusController.getList(user, onGotList, onFail);
    function onGotList(list) {
        // console.log(list);
        res.json(list);
    }

    function onFail(msg) {
        console.error("failed in get wcyList" + msg);
        res.json([]);
    }
});

router.get('/fine', function (req, res, next) {
    opusController.getFineList(onGotList, onFail);

    function onGotList(list) {
        res.json(list);
    }

    function onFail(msg) {
        console.error("failed in get wcyList" + msg);
        res.json([]);
    }
});
router.get('/latest', function (req, res, next) {
    opusController.getLatestList(onGotList, onFail);

    function onGotList(list) {
        res.json(list);
    }

    function onFail(msg) {
        console.error("failed in get wcyList" + msg);
        res.json([]);
    }
});

router.get('/apply/:opusId', authHelper.ensureAuthenticated, function (req, res, next) {
    var user = status.getUserInfo(req, res);
    if (!user) {
        return netCommon.notLogin(req, res);
    }
    var opusId = req.params.opusId || 0,
        msg = "received! apply to publish: " + opusId;
    opusController.applyToPublish(opusId, user.ID);
    res.json(msg);
});

router.get('/approve/:opusId', authHelper.ensureAuthenticated, function (req, res, next) {
    var user = status.getUserInfo(req, res);
    if (!user) {
        return netCommon.notLogin(req, res);
    }

    var opusId = req.params.opusId || 0,
        msg;

    opusController.approveToPublish(user, opusId, function (result) {
        if (result === -1) {
            msg = "not allowed!";
        } else {
            msg = "approve, " + opusId;
        }
        res.json(msg);
    });
});

router.get('/ban/:opusId', authHelper.ensureAuthenticated, function (req, res, next) {
    var user = status.getUserInfo(req, res);
    if (!user) {
        return netCommon.notLogin(req, res);
    }

    var opusId = req.params.opusId || 0,
        msg;

    opusController.ban(user, opusId, function (result) {
        if (result === -1) {
            msg = "not allowed!";
        } else {
            msg = "ban: " + opusId;
        }
        res.json(msg);
    });
});

router.get('/refine/:opusId', authHelper.ensureAuthenticated, function (req, res, next) {
  var user = status.getUserInfo(req, res);
  if (!user) {
    return netCommon.notLogin(req, res);
  }

  var opusId = req.params.opusId || 0,
    msg = "not allowed!";

  if (user.canRefine) {
    opusController.refine(user, opusId, function (result) {
      if (result !== -1) {
        msg = opusId + ': refined successfully!';
      }
      res.json(msg);
    });
  } else {
    res.json(msg);
  }
});

module.exports = router;
