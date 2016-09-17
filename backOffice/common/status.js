/**
 * Created by Andrewz on 1/24/2016.
 */
var userController = require('../db/user/userController');
var defaultUserID = 10,
    COOKIE_LIFE = (90*24*60*60*1000); // 90 days
var user = {
    ID:0,
    name: "anonymouse",
    timesCalled: 0
};

function logUser(req, res, callback) {
    var ua = req.headers['user-agent'],
        ip = req.ip,
        url = req.originalUrl || req.path,
        ips = req.ips;
    console.log("access: user=" + user.ID + ", timesCalled: " + user.timesCalled + ", url=" + url + ", ip = " + ip + ", ua=" + ua + ", ips=" + ips);
    if (callback) {
        callback();
    }
}

function checkUser(req, res, callback) {
    user.timesCalled = getCookieNumber(req, 'timesCalled', 0);
    user.timesCalled++;
    checkUserID(req, res, setUserCookie);
    logUser(req);
    function setUserCookie() {
        res.cookie('userID', user.ID.toString(), { maxAge: COOKIE_LIFE, httpOnly: true });
        res.cookie('timesCalled', user.timesCalled.toString(), { maxAge: COOKIE_LIFE, httpOnly: true });
        res.clearCookie('oldCookie1');
        if (callback) {
            callback();
        }
    }
}

function checkUserID(req, res, callback) {
    if (!!req.checkUserPassed) {
        return (callback ? callback() : null);
    }

    res.userChecked = true;
    user.ID = getCookieNumber(req, 'userID', defaultUserID);
    if (isNewUser()) {
        user.timesCalled = 0;
        userController.add(req, function(doc) {
            res.isRegisteredUser = true;
            user.ID = doc._id;
            if (callback) {
                if (!res.finished) {
                    callback();
                } else {
                    console.log("too late!!!");
                }
            }
        });
    } else {
        res.isRegisteredUser = true;
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
        para = defaultValue;
    }

    if (isNaN(para)) {
        para = defaultValue;
    }

    return para;
}

function isNewUser() {
    return  (user.ID === defaultUserID);
}

exports.user = user;
exports.checkUser = checkUser;
exports.logUser = logUser;
