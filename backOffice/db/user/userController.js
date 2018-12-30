/**
 * Created by admin on 12/5/2015.
 */
// 实现数据库user的增删改查
var Const = require('../../base/const'),
    mongoose = require('mongoose'),
    utils = require('../../common/utils'),
    dbCommon = require('../dbCommonFunc.js'),
    User = mongoose.model('User');

var PAGE_SIZE = 1000;
var PRIVILEGE_APPROVE_TO_PUBLISH = 0x10,
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
    var doc = (Array.isArray(model)) ? model[0]._doc : model._doc,
        groupId = doc.groupId || "00000";
    return {
      result: Const.SUCCESS,
      loggedIn: true,
      errorId: Const.ERROR.NO,
      name: doc.name,
      groupId: groupId,
      userType: getUserType(groupId),
      ID: doc._id,
      displayName: doc.displayName,
      canApprove: !!(doc.privilege & PRIVILEGE_APPROVE_TO_PUBLISH),
      canRefine: !!(doc.privilege & PRIVILEGE_REFINE),
      canBan: !!(doc.privilege & PRIVILEGE_BAN),
      canAdmin: !!(doc.privilege & PRIVILEGE_ADMIN),
      canCT: // create textbook,创建教材内容，
        !!((doc.privilege & PRIVILEGE_CREATE_TEACHER) ||
          (doc.privilege & PRIVILEGE_ARTIST) ||
          (doc.privilege & PRIVILEGE_ADMIN))
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

function getUserType(groupId) {
    var USER_TEACHER = 1,
        USER_PARENT = 3,
        USER_KIDS = 3,
        userType = USER_KIDS,
        lastChar;
    if (groupId) {
        lastChar = groupId[groupId.length - 1];
        switch (lastChar) {
            case '1':
                userType = USER_KIDS;
                break;
            case '6':
                userType = USER_PARENT;
                break;
            case '8':
                userType = USER_TEACHER;
                break;
            default:
                userType = USER_KIDS;
        }
    }
    return userType;
}

exports.get = get;
exports.getList = getList;
exports.add = add; // 游客
exports.setPrivilege = setPrivilege;
exports.model2User = model2User;
exports.composeErrorPkg = composeErrorPkg;
exports.composeUserPkg = composeUserPkg;
