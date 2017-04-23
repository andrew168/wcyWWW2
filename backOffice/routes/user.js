/**
 * Created by Andrewz on 4/19/2017.
 */
var Const = require('../base/const'),
    express = require('express');
var router = express.Router();
var utils = require('../common/utils'); // 后缀.js可以省略，Node会自动查找，
var status = require('../common/status');
var fs = require('fs');

var userController = require('../db/user/userController');
router.post('/signup/:name/:psw/:displayname', signUp);
router.get('/checkname/:name', checkName);
router.get('/login/:name/:psw', login);
router.get('/autoLogin/:name/:ID', autoLogin);

function signUp(req, res, next) {
    console.log("params: " + JSON.stringify(req.params));
    console.log("body: " + JSON.stringify(req.body));
    console.log("query: " + JSON.stringify(req.query));
    var name = req.params.name || null,
        psw = req.params.psw || null,
        displayName = req.params.displayname || null;
    // status.logUser(req);
    var errorID = Const.ERROR.NO;
    if (!isValidFormat(displayName)) {
        errorID = Const.ERROR.DISPLAY_NAME_INVALID;
    } else if (!isValidFormat(name)) {
        errorID = Const.ERROR.NAME_IS_INVALID;
    } else if (!isValidFormat(psw)) {
        errorID = Const.ERROR.PASSWORD_IS_INVALID;
    }

    if (errorID === Const.ERROR.NO) {
        userController.signUp(name,psw, displayName, sendBackUserInfo1);
    } else {
        sendBackUserInfo1({result:false, errorID: errorID});
    }

    function sendBackUserInfo1(data) {
        status.updateUser(data);
        status.setUserCookie(res);
        res.send(data);
    }
}

function checkName(req, res, next) {
    console.log("params: " + JSON.stringify(req.params));
    console.log("body: " + JSON.stringify(req.body));
    console.log("query: " + JSON.stringify(req.query));
    var name = req.params.name || null;

    // status.logUser(req);
    if (isValidFormat(name)) {
        userController.checkName(name, onCheckName);
    } else {
        onCheckName({result: false, errorID: Const.ERROR.NAME_IS_INVALID_OR_TAKEN});
    }

    function onCheckName(result) {
        res.send(result);
    }
}

function login(req, res, next) {
    console.log("params: " + JSON.stringify(req.params));
    console.log("body: " + JSON.stringify(req.body));
    console.log("query: " + JSON.stringify(req.query));
    var name = req.params.name || null,
        psw = req.params.psw || null;

    // status.logUser(req);
    if (isValidFormat(name)) {
        userController.login(name, psw, sendBackUserInfo);
    } else {
        sendBackUserInfo({result:false, errorID: Const.ERROR.PASSWORD_IS_INVALID_OR_INCORRECT});
    }

    function sendBackUserInfo(data) {
        status.updateUser(data);
        status.setUserCookie(res);
        res.send(data);
    }
}

function autoLogin(req, res, next) {
    var name = req.params.name || null,
        ID = req.params.ID || null;

    ID = parseInt(ID);
    // status.logUser(req);
    if (isValidFormat(name) && (status.user.ID === ID)) {
        userController.autoLogin(name, ID, sendBackUserInfo);
    } else {
        sendBackUserInfo({result: false, errorID: Const.ERROR.PASSWORD_IS_INVALID_OR_INCORRECT});
    }

    function sendBackUserInfo(data) {
        status.updateUser(data);
        status.setUserCookie(res);
        res.send(data);
    }
}

function isValidFormat(name) {
    return ((name) && (name.length > 8));
}

module.exports = router;
