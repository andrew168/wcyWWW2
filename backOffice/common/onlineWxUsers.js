/**
 * Created by Andrewz on 1/31/19.
 * 微信code ==》 openId ==> userId
 * 避免重复查找openid
 */

var fs = require('fs'),
  tempFileName = "/data/onlineWxUserDump.txt",
  dataReady = false,
  readyToStop = false,
  users = null;

function add(aUser, wxCode) {
  if (!users) {
    console.error(" not ready");
    return;
  }

  obsoleteExistingToken(aUser);
  users[wxCode] = aUser;  // 3rd: 用tokenId做索引
  console.log("after add2:" + JSON.stringify(users[wxCode]));
}

function get(wxCode) {
  if (!users) {
    console.error(" not ready");
    return;
  }

  if (!users[wxCode]) {
    console.error(" not found: wxCode" + wxCode);
    return null;
  }
  return users[wxCode];
}

function save(callback) {
  function onSaved() {
    readyToStop = true;
    if (callback) {
      callback();
    }
  }

  if (users) {
    obsoleteStaleToken();
    fs.writeFile(tempFileName, JSON.stringify(users), onSaved);
  } else {
    onSaved();
  }
}

function restore() {
  function setup(err, data) {
    users = (!err && data) ? JSON.parse(data) : {};
    if (!users) { // 防止 "null"
      users = {};
    }
    obsoleteStaleToken();
    dataReady = true;
    readyToStop = false;
    // console.log("restored users = " + JSON.stringify(users));
  }

  try {
    fs.readFile(tempFileName, 'utf8', setup);
  } catch (e) {
    setup(true, null);
  }
}

function hasStopped() {
  return readyToStop;
}

function obsoleteExistingToken(aUser) {
// each user can only have one token in the same time
  var ids = Object.keys(users);
  ids.forEach(function (id) {
    if (users[id].ID === aUser.ID) {
      delete users[id];
    }
  })
}

function obsoleteStaleToken() {
  var ids = Object.keys(users);
  ids.forEach(function (id) {
    if (!isValidTokenId(id)) {
      delete users[id];
    }
  })
}

function isValidTokenId(token) {
  return (token.length > 5); //  wx的code都足够长 ，（暂时未判断有效期）
}

exports.add = add;
exports.get = get;
exports.save = save;
exports.restore = restore;
exports.hasStopped = hasStopped;
