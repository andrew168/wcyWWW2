/**
 * Created by Andrewz on 1/24/2016.
 */
var userController = require('../db/user/userController');
var onlineUsers = require('./onlineUsers');
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

function onSignUp(req, res, data) {
    var user = {};
    if (!!data.result && data.loggedIn) {
        user.loggedIn = false;
        user.ID = data.ID;
        user.name = data.name;
        user.isRegistered = true;
        user.displayName = data.displayName;
        user.canApprove = data.canApprove;
        user.canRefine = data.canRefine;
        user.canBan = data.canBan;
        user.canAdmin = data.canAdmin;
        user.tokenID = generateTokenID(user);
        user.token = generateToken(user);
        setUserCookie(user, res);
        onlineUsers.add(user);
    } else {
        user.loggedIn = false;
        user.ID = 0;
        user.name = ANONYMOUS;
        user.isRegistered = false;
        user.displayName = ANONYMOUS;
        user.canApprove = false;
        user.canRefine = false;
        user.canBan = false;
        user.canAdmin = false;
        user.tokenID = 0;
        user.token = null;
    }
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
        res.cookie('userID', user.ID.toString(), {maxAge: COOKIE_LIFE, httpOnly: true, path: '/'});
        res.cookie('tokenID', user.tokenID.toString(), {maxAge: COOKIE_LIFE, httpOnly: true, path: '/'});
        res.cookie('token', user.token, {maxAge: COOKIE_LIFE, httpOnly: true, path: '/'});
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
exports.getUserIDfromCookie = getUserIDfromCookie;
exports.checkUser = checkUser;
exports.logUser = logUser;
exports.setUserCookie = setUserCookie;
exports.onSignUp = onSignUp;
