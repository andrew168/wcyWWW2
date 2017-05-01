/**
 * Created by Andrewz on 4/30/2017.
 * onlineUsers:
 所有当前在线的用户都维护在这里，
 如果连续N小时不活跃， 则踢出去。
 */

var onlineUsers = [];
function add(aUser) {
    console.log("before add:" + JSON.stringify(onlineUsers));
    console.log("new user:" + JSON.stringify(aUser));
    onlineUsers[aUser.tokenID] = aUser;
}

function get(id) {
    if (!onlineUsers[id]) {
        return null;
    }
    return onlineUsers[id];
}

function remove() {

}

function getValidUser(tokenID, token, userID) {
    var candidate = onlineUsers[tokenID];
    if (!candidate || (candidate.ID !== userID) || (candidate.token !==token)) {
        candidate = null;
    }
    return candidate;
}

exports.add = add;
exports.get = get;
exports.getValidUser = getValidUser;
exports.remove = remove;
