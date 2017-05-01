/**
 * Created by Andrewz on 4/19/2017.
 */
var Const = require('../base/const'),
    express = require('express'),
    router = express.Router(),
    utils = require('../common/utils'), // 后缀.js可以省略，Node会自动查找，
    status = require('../common/status'),
    netCommon = require('../common/netCommonFunc'),
    fs = require('fs');

var userController = require('../db/user/userController');
router.post('/signup/:name/:psw/:displayname', signUp);
router.get('/checkname/:name', checkName);
router.get('/login/:name/:psw', login);
router.get('/autoLogin/:name/:ID', autoLogin);
router.get('/list', getList);
router.get('/privilege/:ID/:privilegeCode', setPrivilege);

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
        status.onSignUp(req, res, data);
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
        status.onSignUp(req, res, data);
        res.send(data);
    }
}

function autoLogin(req, res, next) {
    var userIDFromCookie = status.getUserIDfromCookie(req, res),
        name = req.params.name || null,
        ID = req.params.ID || null;

    ID = parseInt(ID);
    // status.logUser(req);
    if (isValidFormat(name) && !!userIDFromCookie && (userIDFromCookie === ID)) {
        userController.autoLogin(name, ID, sendBackUserInfo);
    } else {
        sendBackUserInfo({result: false, errorID: Const.ERROR.PASSWORD_IS_INVALID_OR_INCORRECT});
    }

    function sendBackUserInfo(data) {
        status.onSignUp(req, res, data);
        res.send(data);
    }
}

function getList(req, res, next) {
    var user = status.getUserInfo(req, res);
    if (!user) {
        return netCommon.invalidOperation(req, res);
    }

    if (user.canAdmin) {
        userController.getList(user, onGotList);
    } else {
        res.json("not allowed!");
    }

    function onGotList(list) {
        res.json(list);
    }
}

function setPrivilege(req, res, next) {
    var privilegeCode = req.params.privilegeCode || null,
        clientID = req.params.ID || null,
        user = status.getUserInfo(req, res);

    if (!user) {
        return netCommon.invalidOperation(req, res);
    }

    // user.canAdmin = true;

    if (!privilegeCode || !clientID || !user.canAdmin) {
        return onCompleted("not allowed or wrong parameters!");
    } else {
        privilegeCode = parseInt(privilegeCode);
        clientID = parseInt(clientID);
        userController.setPrivilege(clientID, privilegeCode, onCompleted);
    }
    function onCompleted(msg) {
        res.json(msg);
    }
}

function isValidFormat(name) {
    return ((name) && (name.length > 8));
}

module.exports = router;
