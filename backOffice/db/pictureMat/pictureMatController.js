/**
 * Created by admin on 12/4/2015.
 */
// 实现数据库的增删改查
// 1) 获取我的所有素材和公共分享的素材
// 2) 上传素材，(先获取ID， 上传到Cloundary，在通知：以及上传成功
//


var mongoose = require('mongoose'),
    PictureMat = mongoose.model('PictureMat');

//ToDo: 限制：只选择所有的共享素材，和 我的素材。用Query的 and()操作
function get(userId, callback) {
    PictureMat.find({userId: userId})
        .exec(function (err, data) {
            if (!data) {
                console.error(404, {msg: 'not found!' + id});
            } else {
                console.log(data);
            }

            if (callback){
                callback(err, data);
            }
        });
}

function add(userID, picName, ip, isShared, onSuccess, onError) {
    var aDoc = new PictureMat({
        // userId: userID,
        name: picName,
        ip: ip,
        isShared: isShared
    });

    aDoc.save(function(err, doc) {
        onSave(err, doc, onSuccess, onError);
    });
}

function update(id, uploaded, callback) {
    PictureMat.find({_id: id})
        .exec(function (err, data) {
            if (!data) {
                console.error(404, {msg: 'not found!' + id});
            } else {
                console.log(data);
                data.set('uploaded', true);
                data.save(function (err, data) {
                    if (!err) {
                        if (callback){
                            callback(err, data);
                        }
                    } else {
                        console.error("error in save update picture mat!");
                    }
                });
            }
        });
}
function onSave(err, doc, onSuccess, onError) {
    showDocument(err, doc);
    if (!err) {
        onSuccess(doc._id);
    } else {
        onError(err);
    }
}

function notFound(res) {
    res.json(404, {msg: 'not found'});
}

function showDocument(err, doc) {
    console.log("result: " + err);
    console.log("saved doc is: ", doc);
}

exports.get = get;
exports.add = add;
