// 实现topic数据库的增删改查
var LATEST_topic_NUM = 100;
var mongoose = require('mongoose'),
    dbCommon = require('../dbCommonFunc.js'),
    matCommon = require('../matCommon'),
    Topic = mongoose.model('Topic'); // 获取已经定义的model，（定义见topicSchema的setup)

function get(id, onSuccess, onError) {
    Topic.findOne({_id: id})
        .exec(function (err, data) {
            var msg;
            if (err || !data) {
                onError(dbCommon.composeErrorMsg(err, data));
            } else {
                msg = JSON.stringify(data);
                onSuccess(msg);
                console.log(data);
            }
        });
}

function add(newData, userId, onSuccess, onError) {
    console.info("enter add");
    newData.authorId = userId;

    var aTopic = new Topic(newData);
    aTopic.save(onSave);
    function onSave(err, doc) {
        onSaveTopic(err, doc, onSuccess, onError);
    }
}

function update(newObj, userId, onSuccess, onError) {
    Topic.findOne({_id: newObj._id, authorId: userId})
        .exec(function (err, data) {
            if (err || !data) {
                onError(dbCommon.composeErrorMsg(err, data));
            } else {
                console.log(data);
                dbCommon.updateDate(data, newObj);
                data.set('lastModified', Date.now());
                data.save(function (err, data) {
                    onSaveTopic(err, data, onSuccess, onError);
                });
            }
        });
}


function onSaveTopic(err, model, onSuccess, onError) {
    if (!err) {
        if (onSuccess) {
            onSuccess(model._doc._id, model._doc);
        }
    } else {
        onError(dbCommon.composeErrorMsg(err));
    }
}

// 获取最新的N个主题， 自己的(如果登录了)， 和 优秀公开的
function getList(user, onSuccess, onError) {
    var userLimit = (!user || user.ID === null) ? null : {$or: [{"userId": user.ID}, {"isShared": true}]},
        stateLimit = {"isBanned": false},
        condition = (!userLimit) ? stateLimit : {$and: [userLimit, stateLimit]};

    if (user && (user.canBan || user.canApprove)) {
        condition = null;
    }

    Topic.find(condition).sort({lastModified: -1})
        .exec(function (err, data) {
            if (err || !data) {
                // console.error("data 是null？什么情况？");
                return onError(dbCommon.composeErrorMsg(err, data));
            }
            var result = getLatest(data);
            if (result.length === 0) {
                return onError(dbCommon.composeErrorMsg(err, "no topic found!, should has at least one demo or published"));
            }
            onSuccess(result);
        });

    function getLatest(data) {
        var i,
            result = [],
            num = (!data ? 0 : Math.min(LATEST_topic_NUM, data.length));

        for (i = 0; i < num; i++) {
            var doc1 = data[i]._doc;
            result.push(doc1);
        }

        return result;
    }
}

function ban(id, user, newValue, callback) {
    matCommon.ban(Topic, id, user, newValue, callback);
}

exports.get = get;
exports.add = add;
exports.ban = ban;
exports.update = update;
exports.getList = getList;
