/**
 * Created by admin on 12/4/2015.
 */
// 实现数据库的增删改查
var LATEST_OPUS_NUM = 100;
var mongoose = require('mongoose'),
    utils = require('../../common/utils'),
    Opus = mongoose.model('Opus');

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
        ssPath: ssPath
        // template: templateID
    });

    aOpus.save(onSave);

    function onSave(err, doc) {
        onSaveOpus(err, doc, onSuccess, onError);
    }
}

function onSaveOpus(err, doc, onSuccess, onError) {
    if (!err) {
        if (onSuccess) {
            onSuccess(doc._id, doc.ssPath);
        }
    } else {
        console.error("error in save/update opus!");
        if (onError) {
            onError(err);
        }
    }
}

// 获取最新的10个作品， 有ssPath的， 无论是否我的，
function getList(userId, callback) {
    var condition = null; // (userId === null) ? null : {userId: userId};
    Opus.find(condition).sort({timestamp: -1})
        .exec(function (err, data) {
            if (!data) {
                console.error(404, {msg: 'not found!' + userId});
            } else {
                console.log(data);
            }
            var result = getLatest(data);
            if (result.length === 0) {
                if (userId) {
                    return getList(null, callback);
                }
            }
            callback(result);
        });

    function getLatest(data) {
        var i,
            result = [],
            num = Math.min(LATEST_OPUS_NUM, data.length);

        for (i = 0; i < num; i++ ) {
            if (!data[i].ssPath) {
                continue;
            }
            result.push(data[i]);
        }

        return result;
    }
}

function updateScreenshot(id, path, onSuccess, onError) {
    Opus.findOne({_id: id})
        .exec(function (err, data) {
            if (!data) {
                console.error(404, {msg: 'not found!' + id});
            } else {
                console.log(data);
                data.set('ssPath', path);
                data.set('lastModified', Date.now());
                data.save(onSaved);
            }
        });

    function onSaved (err, data) {
        onSaveOpus(err, data, onSuccess, onError);
    }
}

exports.get = get;
exports.add = add;
exports.getList = getList;
exports.updateScreenshot = updateScreenshot;
