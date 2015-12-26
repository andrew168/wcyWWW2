/**
 * Created by admin on 12/4/2015.
 */
// 实现数据库的增删改查
// 只有一条记录， 就是最新的 ticket，token，及其时间戳
var mongoose = require('mongoose'),
    WxTickets = mongoose.model('WxTickets');

var defaultRecord ={jsapiTicket: null,
    jsapiTicketExpireTime: 0,
    accessToken:  null,
    accessTokenExpireTime: 0};

function get(callback) {
    WxTickets.findOne()
        .exec(function (err, data) {
            if (err) {
                console.error("first time");
                insert(defaultRecord, callback);
            } else {
                console.log(data);
                callback(data);
            }
        });
}

function insert(newData) {
    var newDoc = new WxTickets(newData);
    newDoc.save(function(err, doc) {
        onSave(err, doc, res);
    });
}

function update(newData) {
    var query = WxTickets.findOne({_id:newData._id});
    query.exec(function (err, doc) {
            if (err) { // not found, it's first time,
                throw "Unknown error in ticket db";
            } else {
                console.log(doc);
                var query2 = doc.update({$set: {jsapiTicket: newData.jsapiTicket,
                    jsapiTicketExpireTime: newData.jsapiTicketExpireTime,
                    accessToken:  newData.accessToken,
                    accessTokenExpireTime: newData.accessTokenExpireTime}});
                query2.exec(onSave);
            }
        });
}

function onSave(err, doc) {
    showDocument(err, doc);
}

function notFound(res) {
    res.json(404, {msg: 'not found'});
}

function showDocument(err, doc) {
    console.log("result: " + err);
    console.log("saved doc is: ", doc);
}

exports.get = get;
exports.update = update;
