/**
 * Created by admin on 12/4/2015.
 */
// 实现数据库的增删改查
// 1) 获取我的所有素材和公共分享的素材
// 2) 上传素材，(先获取ID， 上传到Cloundary，在通知：以及上传成功
//


var mongoose = require('mongoose'),
    utils = require('../../common/utils'),
    PictureMat = mongoose.model('PictureMat');

//ToDo: 限制：只选择所有的共享素材，和 我的素材。用Query的 and()操作
function get(userId, callback) {
    PictureMat.find({userId: userId, uploaded: true}).exec(function (err, data) {
        if (!data) {
            console.error(404, {msg: 'not found!' + id});
        } else {
            console.log(data);
        }

        if (callback) {
            var result = [];
            var num = data.length,
                i;

            for (i= 0; i < num; i++) {
                if (!data[i].path) {
                    continue;
                }
                result.push(data[i].path);
            }
            callback(result);
        }
    });
}

function getList(userId, typeId, callback) {
    var condition = (userId === null) ? null : {$and: [{"typeId": typeId}, {$or: [{"userId": userId}, {"isShared": true}]}]};
    PictureMat.find(condition).exec(onSeachResult);
    function onSeachResult(err, data) {
        var result = [];
        if (!data) {
            console.error(404, {msg: 'not found!' + id});
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

function add(userId, picName, typeId, ip, isShared, onSuccess, onError) {
    var aDoc = new PictureMat({
        userId: userId,
        typeId: typeId,
        name: picName,
        ip: ip,
        isShared: isShared
    });

    aDoc.save(function(err, doc) {
        utils.onSave(err, doc, onSuccess, onError);
    });
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
exports.get = get;
exports.add = add;
exports.update = update;
exports.getList = getList;
