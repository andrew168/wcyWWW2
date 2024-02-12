/**
 * Created by admin on 12/5/2015.
 */
// 实现数据库：“展示记录”的增删改查
var mongoose = require("mongoose");
var Show = mongoose.model("Show");

function get(id) {
  Show.findOne({ _id: id })
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
  var aShow = new Show({
    duration: 125,
    os: "Android",
    deviceId: "Samsung-s5"
  });

  aShow.save(function(err, doc) {
    showDocument(err, doc);

    if (!err) {
      res.json(doc);
    } else {
      notFound(res);
    }
  });
}

function notFound(res) {
  res.json(404, { msg: "not found" });
}

function showDocument(err, doc) {
  console.log("result: " + err);
  console.log("saved doc is: ", doc);
}

exports.get = get;
exports.add = add;
