/**
 * Created by admin on 12/4/2015.
 */
// 实现数据库的增删改查
var mongoose = require("mongoose");
var utils = require("../../common/utils");
var Share = mongoose.model("Share");

function get(id) {
  Share.findOne({ _id: id })
    .exec(function(err, data) {
      if (err) {
        console.error("Error", err);
      } else if (!data) {
        console.error(404, { msg: "not found!" + id });
      } else {
        console.log(data);
      }
    });
}

function add(req, res) {
  console.log(req);
  var aShare = new Share({
    // userId:'user1',
    code: "safetycode",
    // opusId:Schema.ObjectId,
    from: "from:" + req.headers.origin,
    paras: "original:" + req.originalUrl
  });

  aShare.save(function(err, doc) {
    utils.onResSave(err, doc, res);
  });
}

exports.get = get;
exports.add = add;
