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

function add(aUser) {
    if (!users) {
        console.error(" not ready");
        return;
    }

    console.log("before add:" + JSON.stringify(users));
    console.log("before add2:" + JSON.stringify(users[aUser.tokenID]));
    console.log("new user:" + JSON.stringify(aUser));
    users[aUser.tokenID] = aUser;
    console.log("after :" + JSON.stringify(users));
    console.log("after add2:" + JSON.stringify(users[aUser.tokenID]));
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

function remove() {

}

function getValidUser(tokenID, token, userID) {
    if (!users) {
        console.error(" not ready");
        return null;
    }

    var candidate = users[tokenID];
    if (!candidate || (candidate.ID !== userID) || (candidate.token !==token)) {
        candidate = null;
    }
    return candidate;
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

        console.log("restored users = " + JSON.stringify(users));
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
