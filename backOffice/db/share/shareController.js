/**
 * Created by admin on 12/4/2015.
 */
// 实现数据库的增删改查
var mongoose = require('mongoose'),
    Share = mongoose.model('Share');

function get(id) {
    Share.findOne({_id: id})
        .exec(function (err, data) {
            if (!data) {
                console.error(404, {msg: 'not found!' + id});
            } else {
                console.log(data);
            }
        });
}


function add(req, res) {
    console.log(req);
    var aShare = new Share({
        // userId:'user1',
        code:'safetycode',
        // opusId:Schema.ObjectId,
        from: "from:" + req.headers.origin,
        paras: "original:" + req.originalUrl
    });

    aShare.save(function(err, doc) {
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
