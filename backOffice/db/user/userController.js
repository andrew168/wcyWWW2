/**
 * Created by admin on 12/5/2015.
 */
// 实现数据库user的增删改查
var Const = require('../../base/const'),
    mongoose = require('mongoose'),
    utils = require('../../common/utils'),
    User = mongoose.model('User');

var PRIVILEGE_APPROVE_TO_PUBLISH = 0x10,
    PRIVILEGE_REFINE = 0x20,
    PRIVILEGE_BAN = 0x40;

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

function autoLogin(name, ID, onComplete) {
    User.find({$and: [{'name': name}, {'_id': ID}]})
        .exec(function (err, model) {
            onComplete(model2User(err, model, Const.ERROR.PASSWORD_IS_INVALID_OR_INCORRECT));
        });
}

function login(name, psw, onComplete) {
    User.find({$and: [{'name': name}, {'psw': psw}]})
        .exec(function (err, model) {
            onComplete(model2User(err, model, Const.ERROR.PASSWORD_IS_INVALID_OR_INCORRECT));
        });
}

function checkName(name, onComplete) {
    User.findOne({name: name})
        .exec(function (err, data) {
            var errorID,
                result;

            if (!err) {
                errorID = Const.ERROR.NO;
                result = true;
            } else {
                errorID = Const.ERROR.NAME_IS_INVALID_OR_TAKEN;
                result = false;
            }
            onComplete({result: result, errorID: errorID});
        });
}

function signUp(name, psw, displayName, onSuccess) {
    var aDoc = new User({
        name: name,
        psw: psw,
        displayName: displayName
    });

    try {
        aDoc.save(function (err, model) {
            onSuccess(model2User(err, model, Const.ERROR_NAME_EXIST_OR_INVALID_FORMAT));
        });
    } catch (e) {
        console.log("Fatal error: at user doc read/write");
        console.log(e);
    }
}

function model2User(err, model, errorID) {
    var pkg;
    if (err || !model || (Array.isArray(model) && (model.length < 1))) {
        pkg = {
            result: 0,
            errorID: errorID,
            error: err
        };
    } else {
        var doc = (Array.isArray(model)) ? model[0]._doc : model._doc,
        pkg = {
            result: 1,
            loggedIn: true,
            errorID: Const.ERROR.NO,
            name: doc.name,
            ID: doc._id,
            displayName: doc.displayName,
            canApprove: !!(doc.privilege & PRIVILEGE_APPROVE_TO_PUBLISH),
            canRefine: !!(doc.privilege & PRIVILEGE_REFINE),
            canBan: !!(doc.privilege & PRIVILEGE_BAN)
        };
    }

    return pkg;
}

function add(req, onSuccess) {
    var aDoc = new User({
        name:'andrew' + new Date().getTime(),
        score: 100 //多余的字段， 将被忽略
    });

    try {
        aDoc.save(function(err, doc) {
            onSuccess(doc);
        });
    } catch(e) {
        console.log("Fatal error: at user doc read/write");
        console.log(e);
    }
}

exports.get = get;
exports.add = add; // 游客
exports.autoLogin = autoLogin;
exports.checkName = checkName;
exports.login = login;
exports.signUp = signUp; // 正式注册用户，
