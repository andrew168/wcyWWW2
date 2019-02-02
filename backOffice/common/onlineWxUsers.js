/**
 * Created by Andrewz on 1/31/19.
 * 微信code ==》 openId ==> userId
 * 避免重复查找openid
 */

var WX_OPEN_ID = 0,
  NICK_NAME = 1,
  TIME_STAMP = 2;

var fs = require('fs'),
  tempFileName = "/data/onlineWxUserDump2.txt",
  dataReady = false,
  readyToStop = false,
  users = null,
  wxCodes = null,
  allowNRunningClient = true; //微信用户， 临时，允许多个用户同时用

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
    fs.writeFile(tempFileName, JSON.stringify({users: users, wxCodes: wxCodes}), onSaved);
  } else {
    onSaved();
  }
}

function restore() {
  function setup(err, data) {
    allData = (!err && data) ? JSON.parse(data) : {};
    if (!allData) { // 防止 "null"
      allData = {};
    }

    // {users: users, wxCodes: wxCodes}
    users = (!allData.users ? {} : allData.users);
    wxCodes = (!allData.wxCodes ? {} : allData.wxCodes);
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
  if (allowNRunningClient) {
    return;
  }

  var ids = Object.keys(users);
  ids.forEach(function (id) {
    if (users[id].ID === aUser.ID) {
      delete users[id];
    }
  })
}

function addWxOpenId(wxOpenId, nickName, wxCode) {
  if (!wxCodes) {
    console.error(" not ready");
    return;
  }

  wxCodes[wxCode] = [wxOpenId, nickName, new Date().getTime()];  // 3rd: 用tokenId做索引
}

function getOpenId(wxCode) {
  if (!wxCodes) {
    console.error(" not ready");
    return null;
  }

  if (!wxCodes[wxCode]) {
    console.error(" not found: wxCode" + wxCode);
    return null;
  }
  return {
    openId: wxCodes[wxCode][WX_OPEN_ID],
    nickName: wxCodes[wxCode][NICK_NAME]
  };
}

function obsoleteStaleWxCode() {
  var ids = Object.keys(wxCodes);
  var oldWxCodeTime = new Date().getTime() - (24*60*60*1000);
  ids.forEach(function (codeExt) {
    var t = wcCodes[codeExt][TIME_STAMP];
    if (t < oldWxCodeTime) {
      delete wcCodes[codeExt];
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
exports.addWxOpenId = addWxOpenId;
exports.getOpenId = getOpenId;
exports.get = get;
exports.save = save;
exports.restore = restore;
exports.hasStopped = hasStopped;
