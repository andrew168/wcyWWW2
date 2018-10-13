/**
 * Created by admin on 12/4/2015.
 */
// 实现数据库的增删改查
// 1) 获取我的所有素材和公共分享的素材
// 2) 上传素材，(先获取ID， 上传到Cloundary，在通知：以及上传成功
//
var mongoose = require('mongoose'),
    utils = require('../../common/utils'),
    dbCommon = require('../dbCommonFunc.js'),
    matCommon = require('../matCommon'),
    PictureMat = mongoose.model('PictureMat');

//ToDo: 限制：只选择所有的共享素材，和 我的素材。用Query的 and()操作
function get(userId, callback) {
    PictureMat.find({userId: userId, uploaded: true}).exec(function (err, data) {
        if (!data) {
            console.error(404, {msg: 'not found!' + id});
        } else {
            // console.log(data);
        }

        if (callback) {
            var result = [];
            var num = data.length,
                i;

            for (i = 0; i < num; i++) {
                var doc1 = data[i];
                if (!doc1.path) {
                    continue;
                }
                result.push(doc1.path);
            }
            callback(result);
        }
    });
}

function getList(userId, typeId, topicId, onSuccess, isAdmin, requestAll) {
    var userLimit = (userId === null) ? null : {$or: [{"userId": userId}, {"isShared": true}]},
        condition = {$and: [{"isBanned": false}, {"typeId": typeId}]},
        needSortExt = false;

    if (userLimit && !isAdmin) {
        condition.$and.push(userLimit);
    }

    if ((!requestAll) && (topicId !== null) && (topicId > 0)) {
        condition.$and.push({topicIds: topicId}); //选出记录，它的topicIds数组中含有元素 topicId，
    } else {
        needSortExt = true;
    }

    function sortByTopic(item1, item2) {
        var val1,
            val2;

        if (item1.topicIds && item1.topicIds.indexOf(topicId) >= 0) {
            val1 = 1;
        } else {
            val1 = 0;
        }

        if (item2.topicIds && item2.topicIds.indexOf(topicId) >= 0) {
            val2 = 1;
        } else {
            val2 = 0;
        }

        if (val1 !== val2) {
            return val2 - val1;
        }
        return (new Date(item2.time)) - (new Date(item1.time));
    }

    PictureMat.find(condition).sort({timestamp: -1}).exec(onSeachResult);

    function onSeachResult(err, data) {
        var result = [];
        if (!data) {
            console.error(404, {msg: 'not found! userId = ' + userId + ", matType =" + typeId});
        } else {
            data.forEach(copyItem);
        }

        if (needSortExt) {
            result.sort(sortByTopic);
        }
        onSuccess(result);

        function copyItem(model) {
            var item = model._doc;
            if (item.path) {
                result.push({
                    _id: item._id,
                    id: item._id, name: item.name, path: item.path, authorID: item.userId,
                    isShared: item.isShared, time: item.timestamp,
                    topicIds: item.topicIds
                });
            }
        }
    }
}

function add(userId, picName, typeId, ip, isShared, onSuccess, onError) {
    var condition = null;
    if (isFullPath(picName)) {
        condition = {"typeId": typeId, "name": picName};
        PictureMat.find(condition).exec(onSeachResult);
    } else {
        doAdd(userId, picName, typeId, ip, isShared, onSuccess, onError);
    }

    function onSeachResult(err, data) {
        if (!data || (data.length < 1)) {
            doAdd(userId, picName, typeId, ip, isShared, onSuccess, onError);
        } else {
            onSuccess(data[0]._doc._id, data[0]._doc.path);
        }
    }
}

function doAdd(userId, picName, typeId, ip, isShared, onSuccess, onError) {
    var aDoc = new PictureMat({
        userId: userId,
        typeId: typeId,
        name: picName,
        ip: ip,
        isShared: isShared
    });

    aDoc.save(function (err, doc) {
        utils.onSave(err, doc, onSuccess, onError);
    });
}

function isFullPath(url) {
    var protocols = ['http://', 'https://'];
    for (var i = 0; i < protocols.length; i++) {
        if (url.indexOf(protocols[i]) === 0) {
            return true;
        }
    }
    return false;
}

function update(id, path, callback) {
    PictureMat.findOne({_id: id})
        .exec(function (err, data) {
            if (!data) {
                console.error(404, {msg: 'not found!' + id});
            } else {
                console.log(data);
                data.set('uploaded', true);
                data.set('path', path);
                data.save(function (err, data) {
                    if (!err) {
                        if (callback) {
                            callback(data._doc._id);
                        }
                    } else {
                        console.error("error in update picture mat!");
                    }
                });
            }
        });
}

function attachTopic(matType, matId, topicId, operator, onSuccess, onError) {
    function doAttach(model) {
        var topicIds = model._doc.topicIds;
        if (!topicIds) {
            topicIds = [];
        }
        if (topicIds.indexOf(topicId) < 0) {
            topicIds.push(topicId);
        }
        model.set('topicIds', topicIds);
    }

    genericUpdate(matId, doAttach, operator, onSuccess, onError);
}

function detachTopic(matType, matId, topicId, operator, onSuccess, onError) {
    function doDetach(model) {
        var id,
            topicIds = model._doc.topicIds;

        if (topicIds && ((id = topicIds.indexOf(topicId)) >= 0)) {
            topicIds.splice(id, 1);
            model.set('topicIds', topicIds);
        }
    }

    genericUpdate(matId, doDetach, operator, onSuccess, onError);
}

function genericUpdate(id, doUpdate, operator, onSuccess, onError) {
    var condition = {_id: id};
    if (!operator.canAdmin) {
        condition.authorId = operator.ID;
    }

    PictureMat.findOne(condition)
        .exec(function (err, data) {
            if (err || !data) {
                onError(dbCommon.composeErrorMsg(err, data));
            } else {
                console.log(data);
                doUpdate(data);
                data.save(function (err, model) {
                    if (err || !model) {
                        onError(dbCommon.composeErrorMsg(err, model));
                    } else {
                        if (onSuccess) {
                            onSuccess(model._doc._id, model._doc);
                        }
                    }
                });
            }
        });
}

function ban(id, user, newValue, callback) {
    matCommon.ban(PictureMat, id, user, newValue, callback);
}

exports.add = add;
exports.attachTopic = attachTopic;
exports.detachTopic = detachTopic;
exports.get = get;
exports.getList = getList;
exports.update = update;
exports.ban = ban;
