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
exports.add = add;
