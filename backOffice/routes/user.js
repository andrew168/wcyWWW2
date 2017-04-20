/**
 * Created by Andrewz on 4/19/2017.
 */
var express = require('express');
var router = express.Router();
var utils = require('../common/utils'); // 后缀.js可以省略，Node会自动查找，
var status = require('../common/status');
var fs = require('fs');

var userController = require('../db/user/userController');
router.post('/signin/:name/:psw/:displayname', signIn);
router.get('/checkname/:name', checkName);
router.get('/login/:name/:psw', login);

function signIn(req, res, next) {
    console.log("params: " + JSON.stringify(req.params));
    console.log("body: " + JSON.stringify(req.body));
    console.log("query: " + JSON.stringify(req.query));
    var name = req.params.name || null,
        psw = req.params.psw || null,
        displayName = req.params.displayname || null;
    // status.logUser(req);
    if (isValidFormat(name) && isValidFormat(displayName) && isValidFormat(psw)) {
        userController.signIn(name,psw, displayName, sendBackUserInfo1);
    } else {
        sendBackUserInfo1({result:false, reason:'invalid format'});
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
        onCheckName(false);
    }

    function onCheckName(result) {
        res.send({result: result});
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
        sendBackUserInfo({result:false});
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
