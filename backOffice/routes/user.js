/**
 * Created by Andrewz on 4/19/2017.
 */
var DEFAULT_ADMIN = 'systemAdmin',// ToDo: 在设置系统管理员之后， 可以删除此账号
    Const = require('../base/const'),
    express = require('express'),
    router = express.Router(),
    utils = require('../common/utils'), // 后缀.js可以省略，Node会自动查找，
    status = require('../common/status'),
    netCommon = require('../common/netCommonFunc'),
    authHelper = require('./authHelper'),
    fs = require('fs');

var userController = require('../db/user/userController');
router.get('/list', authHelper.ensureAuthenticated, getList);
router.get('/privilege/:ID/:privilegeCode', authHelper.ensureAuthenticated, setPrivilege);

function getList(req, res, next) {
    var user = status.getUserInfo(req, res);
    if (!user) {
        return netCommon.notLogin(req, res);
    }

    if (user.canAdmin) {
        userController.getList(user, onGotList);
    } else {
        res.json("not allowed!");
    }

    function onGotList(list) {
        res.json(list);
    }
}

function setPrivilege(req, res, next) {
    var privilegeCode = req.params.privilegeCode || null,
        clientId = req.params.ID || null,
        user = status.getUserInfo(req, res);

    if (!user) {
        return netCommon.notLogin(req, res);
    }

    // user.canAdmin = true;

    if (!privilegeCode || !clientId || (!user.canAdmin && user.name.toLowerCase() !== DEFAULT_ADMIN.toLowerCase())) {
        return onCompleted("not allowed or wrong parameters!");
    } else {
        privilegeCode = parseInt(privilegeCode);
        clientId = parseInt(clientId);
        userController.setPrivilege(clientId, privilegeCode, onCompleted);
    }
    function onCompleted(msg) {
        res.json(msg);
    }
}

function isValidFormat(name) {
    return ((name) && (name.length > 8));
}

module.exports = router;
