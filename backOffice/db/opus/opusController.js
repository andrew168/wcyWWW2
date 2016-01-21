/**
 * Created by admin on 12/4/2015.
 */
// 实现数据库的增删改查
var mongoose = require('mongoose'),
    utils = require('../dbUtils'),
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


function add_old(req, res) {
    console.log(req);
    var aOpus = new Opus({
        // userId:'user1',
        code:'safetycode',
        // opusId:Schema.ObjectId,
        from: "from:" + req.headers.origin,
        paras: "original:" + req.originalUrl
    });

    aOpus.save(function(err, doc) {
        utils.onResSave(err, doc, res);
    });
}

function add(userID, templateID, onSuccess, onError) {
    var aOpus = new Opus({
        // userId: userID,
        // template: templateID
    });

    aOpus.save(function(err, doc) {
        utils.onSave(err, doc, onSuccess, onError);
    });
}

exports.get = get;
exports.add = add;
