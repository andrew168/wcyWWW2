/**
 * Created by Andrewz on 8/4/18.
 * topic的操作：
 * * 上传：post，自动获得唯一化ID
 * * 更新：post
 * * 删除：post，从数据库和Cloundary中删除，(只是ban，非真删除)
 * * 获取：get，我的全部主题
 */
var express = require('express'),
    router = express.Router(),
    netCommon = require('../common/netCommonFunc'),
    status = require('../common/status'),
    authHelper = require('./authHelper'),
    topicController = require('../db/topic/topicController');

// 添加，修改，禁止，发布，等
router.post('/', authHelper.ensureAuthenticated, function (req, res, next) {
    console.log("params: " + JSON.stringify(req.params));
    console.log("body: " + JSON.stringify(req.body));
    console.log("query: " + JSON.stringify(req.query));
    var topicDataObj = req.body; // 已经自动转为object了， 虽然传输是json，

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

router.get('/list', authHelper.ensureAuthenticated, function (req, res, next) {
    var user = status.getUserInfo2(req, res);

    if (!user) {
        return netCommon.notLogin(req, res);
    }

    status.logUser(user, req, res);
    topicController.getList(user.ID, onGotList, onError);

    function onGotList(list) {
        res.json(list);
    }

    function onError(err) {
        res.send(err);
    }
});

// private functions:
function isNewTopic(obj) {
    return (!obj || ((obj.id === undefined) && (obj._id === undefined)))
}

module.exports = router;
