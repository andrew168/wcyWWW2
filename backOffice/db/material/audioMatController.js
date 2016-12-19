/**
 * Created by admin on 12/4/2015.
 */
// 实现数据库的增删改查
// 1) 获取我的所有素材和公共分享的素材
// 2) 上传素材，(先获取ID， 上传到Cloundary，在通知：以及上传成功
//

var mongoose = require('mongoose'),
    utils = require('../../common/utils'),
    AudioMat = mongoose.model('AudioMat');

//ToDo: 限制：只选择所有的共享素材，和 我的素材。用Query的 and()操作
function get(userId, callback) {
    AudioMat.find({uploaded: true}).exec(function (err, data) {
        if (!data) {
            console.error(404, {msg: 'not found data!'});
        } else {
            console.log(data);
        }

        if (callback) {
            var result = [];
            var num = data.length,
                i;

            for (i= 0; i < num; i++) {
                result.push(data[i].path);
            }
            callback(result);
        }
    });
}

function add(userId, audioName, typeId, ip, isShared, onSuccess, onError) {
    var aDoc = new AudioMat({
        userId: userId,
        typeId: typeId,
        name: audioName,
        ip: ip,
        isShared: true // isShared//ToDo:@@test only
    });

    aDoc.save(function(err, doc) {
        utils.onSave(err, doc, onSuccess, onError);
    });
}

function getList(userId, typeId, callback) {
    var userLimit = (userId === null) ? null : {$or: [{"userId": userId}, {"isShared": true}]};
    condition = {$and: [{"isBanned": false}, {"typeId": typeId}]};

    if (userLimit) {
        // condition.$and.push(userLimit);
    }

    AudioMat.find(condition).sort({timestamp: -1}).exec(onSeachResult);
    function onSeachResult(err, data) {
        var result = [];
        if (!data) {
            console.error(404, {msg: 'not found!' + err});
        } else {
            data.forEach(copyItem);
        }

        callback(result);
        function copyItem(item) {
            if (item.path) {
                result.push({name:item.name, path: item.path});
            }
        }
    }
}

function update(id, path, callback) {
    AudioMat.findOne({_id: id})
        .exec(function (err, data) {
            if (!data) {
                console.error(404, {msg: 'not found!' + id});
            } else {
                console.log(data);
                data.set('uploaded', true);
                data.set('path', path);
                data.save(function (err, data) {
                    if (!err) {
                        if (callback){
                            callback(data._id);
                        }
                    } else {
                        console.error("error in save update picture mat!");
                    }
                });
            }
        });
}

function ban(id, callback) {
    AudioMat.findOne({_id: id})
        .exec(function (err, data) {
            if (!data) {
                console.error(404, {msg: 'not found!' + id});
            } else {
                console.log(data);
                data.set('isBanned', true);
                data.save(function (err, data) {
                    if (!err) {
                        if (callback) {
                            callback(data._id);
                        }
                    } else {
                        console.error("error in ban picture mat!");
                    }
                });
            }
        });
}

exports.get = get;
exports.getList = getList;
exports.add = add;
exports.update = update;
exports.ban = ban;
