/**
 * Created by Andrewz on 1/24/2016.
 */
var userController = require('../db/user/userController');
var defaultUserID = 10;
var user = {
    ID:0,
    name: "anonymouse",
    timesCalled: 0
};

function checkUser(req, res, callback) {
    user.timesCalled = getCookieNumber(req, 'timesCalled', 0);
    user.timesCalled++;
    checkUserID(req, res, setUserCookie);
    function setUserCookie() {
        console.log("userID : " + user.ID + ",  timesCalled: " + user.timesCalled);
        res.cookie('userID', user.ID.toString(), { maxAge: 900000, httpOnly: true });
        res.cookie('timesCalled', user.timesCalled.toString(), { maxAge: 900000, httpOnly: true });
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

function getCookieNumber(req, name, defaultValue)
{
    var para = req.cookies.hasOwnProperty(name) ? parseInt(req.cookies[name]) : defaultValue;
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
