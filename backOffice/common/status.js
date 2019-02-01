/**
 * Created by Andrewz on 1/24/2016.
 */
var assert = require('assert'),
    Const = require('../base/const'),
    userController = require('../db/user/userController'),
    onlineUsers = require('./onlineUsers'),
    onlineWxUsers = require('./onlineWxUsers'),
    serverConfig = require('./../bin/serverConfig'),
    authHelper = require('../routes/authHelper');

var ANONYMOUS = "anonymous",
    defaultUserId = 10,
    COOKIE_LIFE = (90*24*60*60*1000); // 90 days
var user = {
    ID:0,
    loggedIn: false,
    isRegistered: false,
    name: ANONYMOUS,
    displayName: ANONYMOUS,
    timesCalled: 0
};

function extendWithoutObject(target, source) {
  for (var prop in source) {
    if (!source.hasOwnProperty(prop) || ((typeof (source[prop])) === 'object')) {
      continue;
    }
    target[prop] = source[prop];
  }
  return target;
}

function onLoginSucceed(req, res, data, tokenId, authInfo) {
    var user = extendWithoutObject({
      loggedIn: true,
      ID: data.ID,
      isRegistered: true
    }, data);

    setUserCookie(user, res);

    setTimeout(function() {
      //case： 在同一台机器上， 分别用不同的账号，登录， 退出
      onlineUsers.add(user, tokenId);
      if (authInfo && (authInfo.authorizer === Const.AUTH.WX)) {
        if (!!authInfo.wx) {
          onlineWxUsers.add(user, authInfo.wx);
        }
        if (!!authInfo.wxCode) {
          onlineWxUsers.add(user, authInfo.wxCode);
        }
      }
    });
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
        canAdmin: false
    };
    setUserCookie(user, res);
}

function logUser(user, req, res, callback) {
  if (!serverConfig.allowLog) {
    if (callback) {
      callback("no log");
    }
    return;
  }

  var ua = req.headers['user-agent'],
    ip = req.ip,
    url = req.originalUrl || req.path,
    ips = req.ips;

  validateUser(req, res, function () {
    console.log("access: user=" + JSON.stringify(user) + ", url=" + url + ", ip = " + ip + ", ua=" + ua + ", ips=" + ips);
    if (callback) {
      callback();
    }
  }, function (msg) {
    console.log("非法逻辑，非法用户，新add也不成功，: user=" + JSON.stringify(user) + ", url=" + url + ", ip = " + ip + ", ua=" + ua + ", ips=" + ips);
    console.log(msg);
    if (callback) {
      callback(msg);
    }
  })
}

function setUserCookie(user, res, callback) {
    try {
        user.timesCalled++;
        res.cookie('timesCalled', user.timesCalled.toString(), {maxAge: COOKIE_LIFE, httpOnly: true, path: '/'});
        res.clearCookie('oldCookie1');
    } catch (err) {
        console.error("error in set cookie!");
    }

    if (callback) {
        callback();
    }
}

function validateUser(req, res, callback, onError) {
    user.ID = getCookieNumber(req, 'userId', defaultUserId);
    user.timesCalled = getCookieNumber(req, 'timesCalled', 0);
    if (isNewUser(user.ID)) {
        user.timesCalled = 0;
        userController.add(req, function(doc) {
            user.ID = doc._id;
            user.isRegistered = true;
            if (callback) {
                callback();
            }
        }, onError);
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

function isNewUser(userId) {
    return ((userId === defaultUserId) || (userId === 0));
}

function getUserInfo(req, res) {
    if (!authHelper.hasAuthInfo(req)) {
        return null;
    }
    return getUserInfo2(req, res);
}

function getUserInfo2(req, res) {
    assert.ok(authHelper.hasAuthInfo(req), "必须在Auth通过之后调用此");
    if (req.userId === undefined) {
        var payload = authHelper.getPayload(req, res);
        req.userId = payload.sub;
        req.tokenId = payload.tokenId;
    }
    return getUserInfoByTokenId(req.tokenId, req.userId);
}

function getUserInfoByTokenId(tokenId, userId) {
    var candidate = null;

    if (!isNewUser(userId)) {
        candidate = onlineUsers.getValidUser(tokenId, userId);
    }

    return candidate;
}

function getUserIdFromCookie(req, res) {
    return getCookieNumber(req, 'userId', defaultUserId);
}

exports.getUserInfo = getUserInfo;
exports.getUserInfo2 = getUserInfo2;
exports.getUserInfoByTokenId = getUserInfoByTokenId;
exports.getUserIdFromCookie = getUserIdFromCookie; //TBD
exports.logUser = logUser;
exports.setUserCookie = setUserCookie;
exports.onLoginSucceed = onLoginSucceed;
exports.onLoginFailed = onLoginFailed;
