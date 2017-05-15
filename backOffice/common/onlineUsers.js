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
    onlineUsers = null;

function add(aUser) {
    if (!onlineUsers) {
        console.error(" not ready");
        return;
    }

    console.log("before add:" + JSON.stringify(onlineUsers));
    console.log("before add2:" + JSON.stringify(onlineUsers[aUser.tokenID]));
    console.log("new user:" + JSON.stringify(aUser));
    onlineUsers[aUser.tokenID] = aUser;
    console.log("after :" + JSON.stringify(onlineUsers));
    console.log("after add2:" + JSON.stringify(onlineUsers[aUser.tokenID]));
}

function get(id) {
    if (!onlineUsers) {
        console.error(" not ready");
        return;
    }

    if (!onlineUsers[id]) {
        return null;
    }
    return onlineUsers[id];
}

function remove() {

}

function getValidUser(tokenID, token, userID) {
    if (!onlineUsers) {
        console.error(" not ready");
        return null;
    }

    var candidate = onlineUsers[tokenID];
    if (!candidate || (candidate.ID !== userID) || (candidate.token !==token)) {
        candidate = null;
    }
    return candidate;
}

function save() {
    function onSaved() {
        readyToStop = true;
    }
    if (onlineUsers) {
        fs.writeFile(tempFileName, JSON.stringify(onlineUsers), onSaved);
    } else {
        onSaved();
    }
}

function restore() {
    function setup(err, data) {
        onlineUsers = (!err && data) ? JSON.parse(data): {};
        if (!onlineUsers) { // 防止 "null"
            onlineUsers = {};
        }
        dataReady = true;
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
exports.remove = remove;
