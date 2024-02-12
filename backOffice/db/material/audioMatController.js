/**
 * Created by admin on 12/4/2015.
 */
// 实现数据库的增删改查
// 1) 获取我的所有素材和公共分享的素材
// 2) 上传素材，(先获取ID， 上传到Cloundary，在通知：以及上传成功
//

var mongoose = require("mongoose");
var utils = require("../../common/utils");
var dbCommon = require("../dbCommonFunc.js");
var AudioMat = mongoose.model("AudioMat");

// ToDo: 限制：只选择所有的共享素材，和 我的素材。用Query的 and()操作
function get(userId, callback) {
  AudioMat.find({ uploaded: true }).exec(function(err, data) {
    if (err) {
      console.error("error", err);
    }
    if (!data) {
      console.error(404, { msg: "not found data!" });
    } else {
      console.log(data);
    }

    if (callback) {
      var result = [];
      var num = data.length;
      var i;

      for (i = 0; i < num; i++) {
        result.push(data[i]._doc.path);
      }
      callback(result);
    }
  });
}

function add(userId, iComponentId, audioName, typeId, ip, isShared, onSuccess, onError) {
  var aDoc = new AudioMat({
    userId: userId,
    typeId: typeId,
    name: audioName,
    ip: ip,
    isShared: isShared
  });
  aDoc.save(function(err, doc) {
    utils.onSave(err, doc, onSuccess, onError);
  });
}

function getList(userId, typeId, topicId, onSuccess, isAdmin) {
  var userLimit = (userId === null) ? null : { $or: [{ "userId": userId }, { "isShared": true }] };
  var condition = { $and: [{ "isBanned": false }, { "typeId": typeId }] };

  if (userLimit && !isAdmin) {
    condition.$and.push(userLimit);
  }

  AudioMat.find(condition).sort({ timestamp: -1 }).exec(onSeachResult);

  function onSeachResult(err, data) {
    var result = [];
    if (!data) {
      console.error(404, { msg: "not found!" + err });
    } else {
      data.forEach(copyItem);
    }

    onSuccess(result);

    function copyItem(model1) {
      var item = model1._doc;
      if (item.path) {
        result.push({
          id: item._id, name: item.name, path: item.path, authorId: item.userId,
          extra: item.extra,
          isShared: item.isShared, time: item.timestamp
        });
      }
    }
  }
}

function update(id, path, callback) {
  AudioMat.findOne({ _id: id })
    .exec(function(err, data) {
      if (err) {
        console.error("Error", err);
      } else if (!data) {
        console.error(404, { msg: "not found!" + id });
      } else {
        console.log(data);
        data.set("uploaded", true);
        data.set("path", path);
        data.save(function(err, data) {
          if (!err) {
            if (callback) {
              callback(data._id);
            }
          } else {
            console.error("error in save update picture mat!");
          }
        });
      }
    });
}

function ban(operator, id, newValue, callback) {
  dbCommon.ban(operator, AudioMat, id, newValue, callback);
}

function addSprite(operator, id, extra, callback) {
  if (typeof extra === "object") {
    extra = JSON.stringify(extra);
  }
  dbCommon.setProp(operator, AudioMat, id, "extra", extra, callback);
}

exports.get = get;
exports.getList = getList;
exports.add = add;
exports.addSprite = addSprite;
exports.update = update;
exports.ban = ban;

