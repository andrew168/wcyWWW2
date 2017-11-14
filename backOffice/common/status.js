/**
 * Created by Andrewz on 1/24/2016.
 */
var assert = require('assert'),
    userController = require('../db/user/userController'),
    onlineUsers = require('./onlineUsers'),
    authHelper = require('../routes/authHelper');

var ANONYMOUS = "anonymous",
    defaultUserID = 10,
    COOKIE_LIFE = (90*24*60*60*1000); // 90 days
var user = {
    ID:0,
    loggedIn: false,
    isRegistered: false,
    name: ANONYMOUS,
    displayName: ANONYMOUS,
    timesCalled: 0
};

function onLoginSucceed(req, res, data) {
    var tokenID = getCookieNumber(req, 'tokenID', 0),
        token = getCookieString(req, 'token', 0),
        user = {
            loggedIn: true,
            ID: data.ID,
            name: data.name,
            isRegistered: true,
            displayName: data.displayName,
            canApprove: data.canApprove,
            canRefine: data.canRefine,
            canBan: data.canBan,
            canAdmin: data.canAdmin
        };

    //case： 在同一台机器上， 分别用不同的账号，登录， 退出
    if (onlineUsers.isValidToken(token, tokenID, user)) {
        user.tokenID = tokenID;
        user.token = token;
    } else {
        onlineUsers.obsolete(tokenID);
        user.tokenID = generateTokenID(user);
        user.token = generateToken(user);
        onlineUsers.add(user);
    }
    setUserCookie(user, res);
}

function onLoginFailed(req, res, data) {
    var user = {
        loggedIn: false,
        ID: 0,
        name: ANONYMOUS,
        isRegistered: false,
        displayName: ANONYMOUS,
        canApprove: false,
        canRefine: false,
        canBan: false,
        canAdmin: false,
        tokenID: 0,
        token: null
    };
    setUserCookie(user, res);
}

function logUser(user, req, res, callback) {
    var ua = req.headers['user-agent'],
        ip = req.ip,
        url = req.originalUrl || req.path,
        ips = req.ips;

    validateUser(req, res, function () {
        console.log("access: user=" + JSON.stringify(user) + ", url=" + url + ", ip = " + ip + ", ua=" + ua + ", ips=" + ips);
        if (callback) {
            callback();
        }
    })
}

function checkUser(req, res, callback) {
    validateUser(req, res, function(){
        setUserCookie(res, callback);
    });
}

function setUserCookie(user, res, callback) {
    try {
        user.timesCalled++;
        if (!user.tokenID || !user.token) {
            res.clearCookie('token');
            res.clearCookie('tokenID');
            res.clearCookie('userID');
        } else {
            res.cookie('userID', user.ID.toString(), {maxAge: COOKIE_LIFE, httpOnly: true, path: '/'});
            res.cookie('tokenID', user.tokenID.toString(), {maxAge: COOKIE_LIFE, httpOnly: true, path: '/'});
            res.cookie('token', user.token, {maxAge: COOKIE_LIFE, httpOnly: true, path: '/'});
        }
        res.cookie('timesCalled', user.timesCalled.toString(), {maxAge: COOKIE_LIFE, httpOnly: true, path: '/'});
        // res.cookie('isPlayOnly', user.timesCalled.toString(), {maxAge: COOKIE_LIFE, path: '/'});
        res.clearCookie('oldCookie1');
    } catch (err) {
        console.error("checkUser is so slow that response has completed!");
    }

    if (callback) {
        callback();
    }
}

function validateUser(req, res, callback) {
    user.ID = getCookieNumber(req, 'userID', defaultUserID);
    user.timesCalled = getCookieNumber(req, 'timesCalled', 0);
    if (isNewUser(user.ID)) {
        user.timesCalled = 0;
        userController.add(req, function(doc) {
            user.ID = doc._id;
            user.isRegistered = true;
            if (callback) {
                callback();
            }
        });
    } else {
        user.isRegistered = true;
        if (callback) {
            callback();
        }
    }
}

function getCookieNumber(req, name, defaultValue) {
    var para = null;
    if (req.cookies && req.cookies[name]) {
        para = parseInt(req.cookies[name]);
    } else {
        console.error("not fond: " + name);
        console.info(JSON.stringify(req.cookies));
        para = defaultValue;
    }

    if (isNaN(para)) {
        para = defaultValue;
    }

    return para;
}

function getCookieString(req, name, defaultValue) {
    var para = null;
    if (req.cookies && req.cookies[name]) {
        para = req.cookies[name];
    } else {
        console.error("not fond: " + name);
        console.info(JSON.stringify(req.cookies));
        para = defaultValue;
    }

    return para;
}

function isNewUser(userID) {
    return ((userID === defaultUserID) || (userID === 0));
}

function getUserInfo(req, res) {
    var userID = getUserIDfromCookie(req, res),
        tokenID = getCookieNumber(req, 'tokenID', 0),
        token = getCookieString(req, 'token', 0),
        candidate = null;

    if (!isNewUser(userID) && tokenID && token) {
        candidate = onlineUsers.getValidUser(tokenID, token, userID);
    }

    return candidate;
}
function getUserInfo2(req, res) {
    assert.ok(authHelper.hasAuthInfo(req), "必须在Auth通过之后调用此");
    var userID = authHelper.getUserId(req, res),
        tokenID = getCookieNumber(req, 'tokenID', 0),
        token = getCookieString(req, 'token', 0),
        candidate = null;

    if (!isNewUser(userID)) {
        candidate = onlineUsers.getValidUser(tokenID, token, userID);
    }

    return candidate;
}

function getUserInfoById(userID) {
    var candidate = null;
    if (!isNewUser(userID)) {
        candidate = onlineUsers.getValidUserById(userID);
    }

    return candidate;
}

function getUserIDfromCookie(req, res) {
    return getCookieNumber(req, 'userID', defaultUserID);
}

function generateTokenID(user) {
    var t = new Date();
    return user.ID + t.getTime();
}

function generateToken(user) {
    var t = new Date();
    return user.ID + t.getTime() + "long";
}

exports.getUserInfo = getUserInfo;
exports.getUserInfo2 = getUserInfo2;
exports.getUserInfoById = getUserInfoById;
exports.getUserIDfromCookie = getUserIDfromCookie; //TBD
exports.checkUser = checkUser;
exports.logUser = logUser;
exports.setUserCookie = setUserCookie;
exports.onLoginSucceed = onLoginSucceed;
exports.onLoginFailed = onLoginFailed;

