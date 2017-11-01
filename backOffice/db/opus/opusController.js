/**
 * Created by admin on 12/4/2015.
 */
// 实现数据库的增删改查
var LATEST_OPUS_NUM = 100;
var mongoose = require('mongoose'),
    utils = require('../../common/utils'),
    dbCommon = require('../dbCommonFunc.js'),
    Opus = mongoose.model('Opus'); // 获取已经定义的model，（定义见opusSchema的setup)
var STATE_PRIVATE = 10,
    STATE_APPLY_TO_PUBLISH = 20, // 必须经过批准才能公开， 防止 出乱子，
    STATE_APPROVED_TO_PUBLISH = 30, //
    STATE_FINE = 40, // 优秀作品
    STATE_BAN = 70;

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

function add(userID, ssPath, templateID, onSuccess, onError) {
    var aOpus = new Opus({
        userId: userID,
        ssPath: ssPath,
        template: templateID
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

// 获取最新的N个作品， 自己的， 或者 优秀公开的，而且有ssPath
function getList(user, callback) {
    var userId = user.ID,
        userLimit = (userId === null) ? null : {"userId": userId},
        condition = (!userLimit) ? {"state": STATE_FINE} : {$or: [userLimit, {"state": STATE_FINE}]};

    if (user.canBan || user.canApprove) {
        condition = null;
    }

    Opus.find(condition).sort({lastModified: -1})
        .exec(function (err, data) {
            if (!data) {
                console.error(404, {msg: 'not found!' + userId});
            } else {
                // console.log(data);
            }
            var result = getLatest(data);
            if (result.length === 0) {
                console.log("no opus found!, should has at least one demo or published");
            }
            callback(result);
        });

    function getLatest(data) {
        if (!data) {
            console.error("data 是null？什么情况？");
        }

        var i,
            result = [],
            num = (!data ? 0 : Math.min(LATEST_OPUS_NUM, data.length));

        for (i = 0; i < num; i++) {
            var doc1 = data[i]._doc;
            if (!doc1.ssPath) {
                //  continue;
            }
            result.push(doc1);
        }

        return result;
    }
}

// 也更新wcy的记录，
function updateScreenshot(userId, id, path, onSuccess, onError) {
    Opus.findOne({_id: id, userId: userId})
        .exec(function (err, data) {
            if (!data) {
                console.error(404, {msg: 'not found!' + id}); // 可能是不同的UserId，不能覆盖他人的作品
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

function applyToPublish(id, playerID, callback) {
    // 必须是自己的才能申请发表， 否则， 无效
    Opus.findOne({$and: [{_id: id}, {userId: playerID}]})
        .exec(function (err, data) {
            if (!data) {
                console.error(404, {msg: 'not found! : ' + id + ", or not belong to : " + playerID});
            } else {
                console.log(data);
                var item = data._doc;
                if (item.state === STATE_PRIVATE) {
                    // state: Number, // 10, 私有的， 20： 申请公开， 30: 批准公开， 41: 禁用
                    data.set('state', STATE_APPLY_TO_PUBLISH);
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

function approveToPublish(id, callback) {
    // 必须是自己的才能申请发表， 否则， 无效
    dbCommon.setProp(Opus, id, 'state', STATE_APPROVED_TO_PUBLISH, callback);
}
function ban(id, callback) {
    dbCommon.setProp(Opus, id, 'state', STATE_BAN, callback);
}

exports.getAuthor = getAuthor;
exports.get = get;
exports.add = add;
exports.getList = getList;
exports.applyToPublish = applyToPublish;
exports.approveToPublish = approveToPublish;
exports.ban = ban;
exports.updateScreenshot = updateScreenshot;
