/**
 * Created by Andrewz on 1/24/2016.
 */
var defaultUserID = 102;

var user = {
    ID:0,
    name: "anonymouse",
    timesCalled: 0
};

function checkUser(req, res) {
    user.timesCalled = getCookie(req, 'timesCalled', 0);
    user.timesCalled++;
    user.ID = checkUserID(req);
    console.log("userID : " + user.ID + ",  timesCalled: " + user.timesCalled);

    res.cookie('userID', user.ID.toString(), { maxAge: 900000, httpOnly: true });
    res.cookie('timesCalled', user.timesCalled.toString(), { maxAge: 900000, httpOnly: true });
    res.clearCookie('oldCookie1');
}

function checkUserID(req) {
    user.ID = getCookie(req, 'userID', defaultUserID);
    if (isNewUser()) {
        //        userController.addDirect(req);
        userID ++;
    }

    return user.ID;
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
    return  ((timesCalled === 0) && (user.ID === defaultUserID));
}

exports.user = user;
exports.checkUser = checkUser;
