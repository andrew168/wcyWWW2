/**
 * Created by Andrewz on 1/24/2016.
 */
var userController = require('../db/user/userController');
var defaultUserID = 10,
    COOKIE_LIFE = (90*24*60*60*1000); // 90 days
var user = {
    ID:0,
    isRegistered: false,
    name: "anonymouse",
    timesCalled: 0
};

function logUser(req, res, callback) {
    var ua = req.headers['user-agent'],
        ip = req.ip,
        url = req.originalUrl || req.path,
        ips = req.ips;

    validateUser(req, res, function () {
        console.log("access: user=" + user.ID + ", timesCalled: " + user.timesCalled + ", url=" + url + ", ip = " + ip + ", ua=" + ua + ", ips=" + ips);
        if (callback) {
            callback();
        }
    })
}

function checkUser(req, res, callback) {
    validateUser(req, res, setUserCookie);
    function setUserCookie() {
        try {
            user.timesCalled++;
            res.cookie('userID', user.ID.toString(), {maxAge: COOKIE_LIFE, httpOnly: true, path: '/'});
            res.cookie('timesCalled', user.timesCalled.toString(), {maxAge: COOKIE_LIFE, httpOnly: true, path: '/'});
            // res.cookie('isPlayOnly', user.timesCalled.toString(), {maxAge: COOKIE_LIFE, path: '/'});
            res.clearCookie('oldCookie1');
            if (callback) {
                callback();
            }
        } catch(err) {
            console.error("checkUser is so slow that response has completed!");
        }
    }
}

function validateUser(req, res, callback) {
    user.ID = getCookieNumber(req, 'userID', defaultUserID);
    user.timesCalled = getCookieNumber(req, 'timesCalled', 0);
    if (isNewUser()) {
        user.timesCalled = 0;
        userController.addGuest(req, function(doc) {
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

function isNewUser() {
    return ((user.ID === defaultUserID) || (user.ID === 0));
}

function isRegisteredUser() {
    return  (user.isRegistered);
}

exports.user = user;
exports.checkUser = checkUser;
exports.logUser = logUser;
exports.isRegisteredUser = isRegisteredUser;
