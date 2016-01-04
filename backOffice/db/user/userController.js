/**
 * Created by admin on 12/5/2015.
 */
// 实现数据库user的增删改查
var mongoose = require('mongoose'),
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

function add(req, res) {
    var aDoc = new User({
        name:'andrew' + new Date().getTime(),
        score: 100 //多余的字段， 将被忽略
    });

    aDoc.save(function(err, doc) {
        onSave(err, doc, res);
    });
}

function onSave(err, doc, res) {
    showDocument(err, doc);
    if (!err) {
        res.json(doc);
    } else {
        notFound(res);
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
