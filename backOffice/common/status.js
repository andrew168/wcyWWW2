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

var extraCallback = null;

function checkUser(req, res) {
    user.timesCalled = getCookie(req, 'timesCalled', 0);
    user.timesCalled++;
    checkUserID(req, res, function(){
        console.log("userID : " + user.ID + ",  timesCalled: " + user.timesCalled);
        res.cookie('userID', user.ID.toString(), { maxAge: 900000, httpOnly: true });
        res.cookie('timesCalled', user.timesCalled.toString(), { maxAge: 900000, httpOnly: true });
        res.clearCookie('oldCookie1');
    });
}

function checkUserID(req, res, callback) {
    if (!!req.checkUserPassed) {
        return;
    }

    res.userChecked = true;
    user.ID = getCookie(req, 'userID', defaultUserID);
    if (isNewUser()) {
        user.timesCalled = 0;
        userController.add(req, function(doc) {
            res.isRegisteredUser = true;
            user.ID = doc._id;
            if (callback) {
                callback();
            }
            if (extraCallback) {
                extraCallback();
                extraCallback = null;
            }
        });
    } else {
        res.isRegisteredUser = true;
        if (callback) {
            callback();
        }
    }
}

function getCookie(req, name, defaultValue)
{
    var para;
    if (!req.cookies[name]) {
        para = defaultValue;
    } else {
        para = req.cookies[name];
        para = parseInt(para);
    }

    return para;
}

function isNewUser() {
    return  (user.ID === defaultUserID);
}

function setExtraCallback(callback) {
    extraCallback = callback;
}

exports.user = user;
exports.checkUser = checkUser;
exports.setExtraCallback = setExtraCallback;
