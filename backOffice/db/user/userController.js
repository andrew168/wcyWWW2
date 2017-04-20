/**
 * Created by admin on 12/5/2015.
 */
// 实现数据库user的增删改查
var mongoose = require('mongoose'),
    utils = require('../../common/utils'),
    User = mongoose.model('User');

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

function login(name, psw, onComplete) {
    User.find({$and: [{'name': name}, {'psw': psw}]})
        .exec(function (err, model) {
            onComplete(model2User(err, model));
        });
}

function checkName(name, onComplete) {
    User.findOne({name: name})
        .exec(function (err, data) {
            if (!err) {
                onComplete({result: true});
            } else {
                onComplete({result: false});
            }
        });
}

function signIn(name, psw, displayName, onSuccess) {
    var aDoc = new User({
        name: name,
        psw: psw,
        displayName: displayName
    });

    try {
        aDoc.save(function (err, model) {
            onSuccess(model2User(err, model));
        });
    } catch (e) {
        console.log("Fatal error: at user doc read/write");
        console.log(e);
    }
}

function model2User(err, model) {
    var pkg;
    if (err || !model || (Array.isArray(model) && (model.length < 1))) {
        pkg = {
            result: 0,
            reason: 'DB failed!',
            error: err
        };
    } else {
        var doc = (Array.isArray(model)) ? model[0]._doc : model._doc,
        pkg = {
            result: 1,
            loggedIn: true,
            name: doc.name,
            ID: doc._id,
            displayName: doc.displayName
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
exports.checkName = checkName;
exports.login = login;
exports.signIn = signIn; // 正式注册用户，
