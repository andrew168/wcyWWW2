/**
 * Created by Andrewz on 4/30/2017.
 * onlineUsers:
 所有当前在线的用户都维护在这里，
 如果连续N小时不活跃， 则踢出去。
 */

var fs = require('fs'),
    tempFileName = "/data/onlineUserDump.txt",
    dataReady = false,
    readyToStop = false,
    users = null;

function add(aUser, tokenId) {
    if (!users) {
        console.error(" not ready");
        return;
    }

    // console.log("before add:" + JSON.stringify(users));
    console.log("before add2:" + JSON.stringify(users[tokenId]));
    console.log("new user:" + JSON.stringify(aUser));
    users[tokenId] = aUser;  // 3rd: 用tokenId做索引
    console.log("after add2:" + JSON.stringify(users[tokenId]));
}

function get(id) {
    if (!users) {
        console.error(" not ready");
        return;
    }

    if (!users[id]) {
        return null;
    }
    return users[id];
}

function obsolete(tokenId) {
    delete users[tokenId];
}

function getValidUser(tokenId, userId) {
    if (!users) {
        console.error(" not ready");
        return null;
    }

    //第三代： tokenId, 支持用户同时在多个机器，多个浏览器，多个window user下使用。
    var candidate = users[tokenId]; // 第3代： userId
    if (!candidate) { // try  第一代tokenID style
        candidate = users[userId];
    }
    if (!candidate || (candidate.ID !== userId)) {
        candidate = null;
    }
    return candidate;
}

function getValidUserById(userID) {
    if (!users) {
        console.error(" not ready");
        return null;
    }

    var candidate = users[userID];
    if (!candidate || (candidate.ID !== userID)) {
        candidate = null;
    }
    return candidate;
}

function isValidToken(oldToken, user) {
    return !!getValidUser(oldToken, user.ID);
}

function save(callback) {
    function onSaved() {
        readyToStop = true;
        if (callback) {
            callback();
        }
    }

    if (users) {
        fs.writeFile(tempFileName, JSON.stringify(users), onSaved);
    } else {
        onSaved();
    }
}

function restore() {
    function setup(err, data) {
        users = (!err && data) ? JSON.parse(data): {};
        if (!users) { // 防止 "null"
            users = {};
        }
        dataReady = true;

        // console.log("restored users = " + JSON.stringify(users));
    }
    try {
        fs.readFile(tempFileName, 'utf8', setup);
    } catch(e) {
        setup(true, null);
    }
}

function isReady() {
    return dataReady;
}

function hasStopped() {
    return readyToStop;
}

exports.add = add;
exports.get = get;
exports.isReady = isReady;
exports.hasStopped = hasStopped;
exports.save = save;
exports.restore = restore;
exports.getValidUser = getValidUser;
exports.getValidUserById = getValidUserById;
exports.isValidToken = isValidToken;
exports.obsolete = obsolete;
