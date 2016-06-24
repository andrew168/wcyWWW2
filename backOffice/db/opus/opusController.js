/**
 * Created by admin on 12/4/2015.
 */
// 实现数据库的增删改查
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

function add(userID, templateID, onSuccess, onError) {
    var aOpus = new Opus({
        userId: userID
        // template: templateID
    });

    aOpus.save(function(err, doc) {
        utils.onSave(err, doc, onSuccess, onError);
    });
}

function getList(userId, callback) {
    var condition = (userId === null) ? null : {userId: userId};
    Opus.find(condition)
        .exec(function (err, data) {
            if (!data) {
                console.error(404, {msg: 'not found!' + id});
            } else {
                console.log(data);
            }
            callback(data);
        });
}

exports.get = get;
exports.add = add;
exports.getList = getList;
