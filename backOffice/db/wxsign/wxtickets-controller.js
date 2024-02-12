/**
 * Created by admin on 12/4/2015.
 */
// 实现数据库的增删改查
// 只有一条记录， 就是最新的 ticket，token，及其时间戳
var mongoose = require("mongoose");
var utils = require("../../common/utils");
var WxTickets = mongoose.model("WxTickets");

var defaultRecord = { jsapiTicket: null,
  jsapiTicketExpireTime: 0,
  accessToken: null,
  accessTokenExpireTime: 0 };

function get(callback) {
  WxTickets.findOne()
    .exec(function(err, data) {
      if (err) {
        console.error("first time");
        insert(defaultRecord, callback);
      } else {
        console.log(data);
        callback(data._doc);
      }
    });
}

function insert(newData) {
  var newDoc = new WxTickets(newData);
  const res = null;
  newDoc.save(function(err, doc) {
    utils.onResSave(err, doc, res);
  });
}

function update(newData) {
  var query = WxTickets.findOne({ _id: newData._id });
  query.exec(function(err, model) {
    console.error("need update to model.doc");
    if (err) { // not found, it's first time,
      console.error("Error", "Unknown error in ticket db");
    } else {
      console.log(model);
      var query2 = model.update({ $set: { jsapiTicket: newData.jsapiTicket,
        jsapiTicketExpireTime: newData.jsapiTicketExpireTime,
        accessToken: newData.accessToken,
        accessTokenExpireTime: newData.accessTokenExpireTime }});
      query2.exec(utils.dumpDocument);
    }
  });
}

exports.get = get;
exports.update = update;
