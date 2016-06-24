/**
 * Created by admin on 12/5/2015.
 */
var express = require('express');
var router = express.Router();
var utils = require('../common/utils'); // 后缀.js可以省略，Node会自动查找，
var status = require('../common/status');
var fs = require('fs');

var opusController = require('../db/opus/opusController');

router.get('/', function(req, res, next) {
    status.checkUser(req, res);
    opusController.getList(status.user.ID, onGotList, onFail);
    function onGotList(list) {
        console.log(list);
        res.json(list);
    }

    function onFail(msg) {
        console.error("failed in getWcyList" + msg);
    }
});

module.exports = router;
