/**
 * Created by admin on 12/4/2015.
 */
// 实现数据库的增删改查
var LATEST_OPUS_NUM = 100;
var mongoose = require('mongoose'),
    utils = require('../../common/utils'),
    dbCommon = require('../dbCommonFunc.js'),
    CONST = require('../../common/const'),
    Opus = mongoose.model('Opus'); // 获取已经定义的model，（定义见opusSchema的setup)

function get(id) {
    Opus.findOne({_id: id})
        .exec(function (err, data) {
            if (!data) {
                console.error(404, {msg: 'not found!' + id});
            } else {
                console.log(data);
            }
        });
}

function add(userId, ssPath, templateId, wcyHeader, onSuccess, onError) {
    console.info("enter add");
    var aOpus = new Opus({
        userId: userId,
        ssPath: ssPath,
        template: templateId,
        // 除了在wcy.js中特别用到的属性之外， 其余都通过wcyHeader（总体描述）传进来，
        // 以简化新增属性的影响范围
        title: wcyHeader.title || "",
        topicId: wcyHeader.topicId || 0
    });

    aOpus.save(onSave);

    function onSave(err, doc) {
        onSaveOpus(err, doc, onSuccess, onError);
    }
}

function onSaveOpus(err, model, onSuccess, onError) {
    if (!err) {
        if (onSuccess) {
            onSuccess(model._doc._id, model._doc.ssPath);
        }
    } else {
        console.error("error in save/update opus!");
        if (onError) {
            onError(err);
        }
    }
}

// 管理员： 除了ban的都返回
// 普通用户： 只是自己的，（除了ban的）（不包括他人的）
function getList(user, callback) {
    var userId = user.ID,
        notBanned = {"state": {$ne: CONST.OPUS_STATE.BAN}},
        userLimit = (userId === null) ? null : {"userId": userId},
        condition = userLimit;

    if (user.canBan || user.canApprove) {
        condition = null;
    }

    if (condition) {
        condition = {$and: [notBanned, condition]};
    } else {
        condition = notBanned;
    }
    Opus.find(condition).sort({lastModified: -1}).exec(function (err, data) {
        var result = composeOpusList(err, data);
        callback(result);
    });
}

function composeOpusList(err, data) {
    var i,
        result = [],
        num;

    if (err || !data) {
        console.error(404, {msg: 'not found!' + userId});
    } else {
        num = (!data ? 0 : Math.min(LATEST_OPUS_NUM, data.length));
        for (i = 0; i < num; i++) {
            var doc1 = data[i]._doc;
            if (!doc1.ssPath) {
                //  continue;
            }
            result.push(doc1);
        }
    }

    return result;
}

function getSpecifiedList(callback, stateRequested) {
    var notBanned = {"state": {$ne: CONST.OPUS_STATE.BAN}},
        condition = {"state": stateRequested};
    condition = {$and: [notBanned, condition]};
    Opus.find(condition).sort({lastModified: -1}).exec(function (err, data) {
        var result = composeOpusList(err, data);
        callback(result);
    });
}

function getLatestList(callback) {
    getSpecifiedList(callback, CONST.OPUS_STATE.PUBLISHED);
}

function getFineList(callback) {
    getSpecifiedList(callback, CONST.OPUS_STATE.FINE);
}

// 也更新wcy的记录，
function updateScreenshot(userId, id, path, onSuccess, onError) {
    console.info("enter update Screenshot");
    Opus.findOne({_id: id, userId: userId})
        .exec(function (err, data) {
            if (!data) {
                console.error("opusId = " + id + 'userId = ' + userId); // 可能是不同的UserId，不能覆盖他人的作品
                console.error(id + ' opus not found!'); // 可能是不同的UserId，不能覆盖他人的作品
                add(userId, path, id, onSuccess, onError); // 因此， 以建立新文件， 注明是以他人的作品为模板的
            } else {
                console.log(data);
                data.set('ssPath', path);
                data.set('lastModified', Date.now());
                data.save(onSaved);
            }
        });

    function onSaved(err, data) {
        onSaveOpus(err, data, onSuccess, onError);
    }
}

function getAuthor(opusId, onCompleted) {
    Opus.findOne({_id: opusId})
        .exec(function (err, doc) {
            var author;
            if (!doc) {
                console.error(404, {msg: "couldn't find user for opus: !" + opusId});
                author = {ID: 1};
            } else {
                console.log(doc);
                author = {
                    ID: doc.userId,
                    timestamp: doc.timestamp,
                    lastModified: doc.lastModified,
                    ssPath: doc.ssPath,
                    template: doc.template
                };
            }

            onCompleted(author)
        });
}

function applyToPublish(id, playerId, callback) {
    // 必须是自己的才能申请发表， 否则， 无效
    Opus.findOne({$and: [{_id: id}, {userId: playerId}]})
        .exec(function (err, data) {
            if (!data) {
                console.error(404, {msg: 'not found! : ' + id + ", or not belong to : " + playerId});
            } else {
                console.log(data);
                var item = data._doc;
                if (item.state === CONST.OPUS_STATE.PRIVATE) {
                    // state: Number, // 10, 私有的， 20： 申请公开， 30: 批准公开， 41: 禁用
                    data.set('state', CONST.OPUS_STATE.APPLY_TO_PUBLISH);
                    data.save(function (err, data) {
                        if (!err) {
                            if (callback) {
                                callback(item._id);
                            }
                        } else {
                            console.error("error in ban picture mat!");
                        }
                    });
                }
            }
        });
}

function approveToPublish(operator, id, callback) {
    // 必须是自己的才能申请发表， 否则， 无效
    dbCommon.setProp(operator, Opus, id, 'state', CONST.OPUS_STATE.PUBLISHED, callback);
}
function ban(operator, id, callback) {
    dbCommon.setProp(operator, Opus, id, 'state', CONST.OPUS_STATE.BAN, callback);
}

exports.getAuthor = getAuthor;
exports.get = get;
exports.add = add;
exports.getList = getList;
exports.getLatestList = getLatestList;
exports.getFineList = getFineList;
exports.applyToPublish = applyToPublish;
exports.approveToPublish = approveToPublish;
exports.ban = ban;
exports.updateScreenshot = updateScreenshot;
