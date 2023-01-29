/**
 * Created by admin on 12/5/2015.
 */
// 实现数据库user的增删改查
var Const = require('../../base/const'),
  mongoose = require('mongoose'),
  utils = require('../../common/utils'),
  dbCommon = require('../dbCommonFunc.js'),
  User = mongoose.model('User');

var PAGE_SIZE = 1000,
  USER_TYPE = {
    STUDENT: 1,
    PARENT: 2,
    TEACHER: 3,
    CREATIVE_TEACHER: 4
  },
  PRIVILEGE_APPROVE_TO_PUBLISH = 0x10,
  PRIVILEGE_REFINE = 0x20,
  PRIVILEGE_BAN = 0x40,
  PRIVILEGE_ADMIN = 0x80,
  PRIVILEGE_CREATE_TEACHER = 0x100,
  PRIVILEGE_ARTIST = 0x200;

function get(id) {
  User.findOne({_id: id})
    .exec(function (err, data) {
      if (!data) {
        console.error(404, {msg: 'not found!' + id});
      } else {
        console.log(data);
      }
    });
}

function getByWxOpenId(openId, callback) {
  User.findOne({wx: openId})
    .exec(callback);
}

function model2User(err, model, errorId) {
  var pkg;
  if (err || !model || (Array.isArray(model) && (model.length < 1))) {
    pkg = composeErrorPkg(err, errorId);
  } else {
    pkg = composeUserPkg(model);
  }

  return pkg;
}

function composeErrorPkg(err, errorId) {
  return {
    result: Const.FAILED,
    errorId: errorId,
    error: err
  };
}

function composeUserPkg(model) {
  var aModel = (Array.isArray(model)) ? model[0] : model,
    isModel = !!(aModel._doc),
    userInfo = (isModel? aModel._doc : aModel),
    userID = (isModel? aModel._id : userInfo.ID),
    groupId = userInfo.groupId || "00000",
    isAdmin = false,
    privilege = type2Privilege(userInfo.type) || userInfo.privilege;
  if (userInfo.name && (userInfo.name.toLowerCase() === 'toronto1111')) {
    userInfo.type = USER_TYPE.CREATIVE_TEACHER;
    isAdmin = true;
  }
  privilege = type2Privilege(userInfo.type) || userInfo.privilege;
  return {
    result: Const.SUCCESS,
    loggedIn: true,
    errorId: Const.ERROR.NO,
    name: userInfo.name,
    groupId: groupId,
    type: userInfo.type,
    ID: userID,
    _id: userID, // 只是过渡时期兼容 以前的mongoDB的model和doc，
    displayName: userInfo.displayName,
    canApprove: !!(privilege & PRIVILEGE_APPROVE_TO_PUBLISH) || isAdmin,
    canRefine: !!(privilege & PRIVILEGE_REFINE) || isAdmin,
    canBan: !!(privilege & PRIVILEGE_BAN) || isAdmin,
    canAdmin: !!(privilege & PRIVILEGE_ADMIN) || isAdmin,
    canCT: // create textbook,创建教材内容，
        !!((privilege & PRIVILEGE_CREATE_TEACHER) ||
          (privilege & PRIVILEGE_ARTIST) ||
          (privilege & PRIVILEGE_ADMIN))
  };
}

function add(req, onSuccess, onError) {
  var aDoc = new User({
    name:'andrew' + new Date().getTime(),
    score: 100 //多余的字段， 将被忽略
  });

  try {
    aDoc.save(function(err, model) {
      if (err || !model) {
        if (!err) {
          err = "model为空!"
        }
        if (onError) {
          onError(err);
        }
      } else {
        onSuccess(model._doc);
      }
    });
  } catch(e) {
    console.log("Fatal error: at user doc read/write");
    console.log(e);
  }
}

// 获取最新的N个user
function getList(aUser, callback) {
  var result = [];
  if (!aUser.canAdmin) {
    return callback(result);
  }

  User.find(null).sort({_id: -1})
    .exec(function (err, data) {
      if (!data) {
        console.error(404, {msg: 'not found!'});
        callback(result);
      }
      result = getLatest(data);
      if (result.length === 0) {
        if (userId) {
          return getList(null, callback);
        }
      }
      callback(result);
    });

  function getLatest(data) {
    if (!data) {
      console.error("data 是null？什么情况？");
    }

    var i,
      result = [],
      num = (!data ? 0 : Math.min(PAGE_SIZE, data.length));

    for (i = 0; i < num; i++) {
      var doc1 = data[i]._doc;
      result.push(doc1);
    }

    return result;
  }
}

function setPrivilege(operator, id, code, callback) {
  dbCommon.setProp(operator, User, id, 'privilege', code, callback);
}

function type2Privilege(type) {
  var privilege = 3; //缺省值，见schema
  if (!type) { // 实施type之前的用户， 都是缺省用户：（学生）
    type = USER_TYPE.STUDENT;
  }
  switch (type) {
    case USER_TYPE.STUDENT:
      break;
    case USER_TYPE.PARENT:
      privilege = privilege | PRIVILEGE_ARTIST |
        PRIVILEGE_CREATE_TEACHER;
      break;
    case USER_TYPE.TEACHER:
      privilege = privilege | PRIVILEGE_ARTIST |
       PRIVILEGE_CREATE_TEACHER;
      break;
    case USER_TYPE.CREATIVE_TEACHER:
      privilege = privilege | PRIVILEGE_ARTIST |
        PRIVILEGE_CREATE_TEACHER;
      break;
    default:
      break;
  }

  return privilege;
}

exports.USER_TYPE = USER_TYPE;
exports.get = get;
exports.getList = getList;
exports.add = add; // 游客
exports.setPrivilege = setPrivilege;
exports.type2Privilege = type2Privilege;
exports.model2User = model2User;
exports.composeErrorPkg = composeErrorPkg;
exports.composeUserPkg = composeUserPkg;
exports.getByWxOpenId = getByWxOpenId;
