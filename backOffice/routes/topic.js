/**
 * Created by Andrewz on 8/4/18.
 * topic的操作：
 * * 上传：post，自动获得唯一化ID
 * * 更新：post
 * * 删除：post，从数据库和Cloundary中删除，(只是ban，非真删除)
 * * 获取：get，我的全部主题
 */
var express = require("express");
var router = express.Router();
var netCommon = require("../common/netCommonFunc");
var status = require("../common/status");
var authHelper = require("./authHelper");
var audit = require("./audit");
var topicController = require("../db/topic/topicController");

// 添加，修改，禁止，发布，等
router.post("/", authHelper.ensureAuthenticated, function(req, res, next) {
  console.log("params: " + JSON.stringify(req.params));
  console.log("body: " + JSON.stringify(req.body));
  console.log("query: " + JSON.stringify(req.query));

  var topicDataObj = req.body; var // 已经自动转为object了， 虽然传输是json，
    user = status.getUserInfo(req, res);
  var isAudit = (req.query && req.query.isAudit) ? req.query.isAudit : false;
  var auditResult;

  if (!user) {
    return netCommon.notLogin(req, res);
  }

  if (isAudit) {
    auditResult = audit.process(req);
    if (auditResult.isAudit && ((user.canBan || user.canApprove))) {
      var onAuditCompleted = function fn(result) {
        var data = {
          result: result,
          newValues: auditResult.newValues,
          id: auditResult._id
        };

        res.json(data);
      };

      return topicController.ban(user, auditResult._id, auditResult.newValues, onAuditCompleted);
    }
  }

  // 检查并处理公共操作
  if (isNewTopic(topicDataObj)) {
    topicController.add(topicDataObj, req.userId, onSuccess, onError);
  } else {
    topicController.update(topicDataObj, req.userId, onSuccess, onError);
  }

  function onSuccess(id, doc) {
    res.json(doc);
  }

  function onError(err) {
    res.json(err);
  }
});

router.get("/list", function(req, res, next) {
  var user = (!authHelper.hasAuthInfo(req)) ? null : status.getUserInfo2(req, res);
  topicController.getList(user, onGotList, onError);
  function onGotList(list) {
    res.json(list);
  }

  function onError(err) {
    res.send(err);
  }
});

// private functions:
function isNewTopic(obj) {
  return (!obj || ((obj.id === undefined) && (obj._id === undefined)));
}

module.exports = router;
