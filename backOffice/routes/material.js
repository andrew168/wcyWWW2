/**
 * Created by Andrewz on 1/5/2016.
 * 素材的操作：
 * * 上传：自动获得唯一化ID，和签名，
 * * 删除：从数据库和Cloundary中删除，
 * * 更新：更新Cloundary， 更新数据库中的记录
 * * 获取：我的全部素材
 *
 * 在客户端，根据文件名， 决定素材的类别（Picture， Audio， Video，等）
 */
var express = require('express');
var router = express.Router();
var utils = require('../common/utils'); // 后缀.js可以省略，Node会自动查找，
var cSignature = require('../common/cloundarySignature'); // 后缀.js可以省略，Node会自动查找，
var status = require('../common/status');
var fs = require('fs');

var pictureMatController = require('../db/material/pictureMatController');
var audioMatController = require('../db/material/audioMatController');

var TYPE_BKG_IMAGE = 10, // 'bkgimage',
    TYPE_PROP_IMAGE = 20, // 'propimage',
    TYPE_PEOPLE_IMAGE = 30, // 'peopleimage',
    TYPE_SOUND = 40; //,'audio';

router.post('/', function(req, res, next) {
    console.log("params: " + JSON.stringify(req.params));
    console.log("body: " + JSON.stringify(req.body));
    console.log("query: " + JSON.stringify(req.query));
    var public_id = req.body.public_id || null,
        ban = req.body.ban || false,
        matType = getMatType(req),
        path = req.body.path || null;

    status.logUser(req);
    if (ban) {
        if (!public_id) {
            public_id = utils.path2public_id(path);
        }
        return banMatId(req, res, matType, utils.matName2Id(public_id));
    }

    if (!public_id) {
        var originalFilename = req.body.filename || "no_filename";
        createMatId(req, res, matType, originalFilename);
    } else {
        updateMatId(req, res, matType, utils.matName2Id(public_id), path);
    }
});

router.get('/', function(req, res, next) {
    console.log("params: " + JSON.stringify(req.params));
    console.log("body: " + JSON.stringify(req.body));
    console.log("query: " + JSON.stringify(req.query));

    //ToDo:@@@
    getMatIds(req, res, getMatType(req));
});

// 定义RESTFull API（路径）中的参数，形参
router.param('matType', function (req, res, next, id) {
    next();
});

router.get('/list/:matType', function(req, res, next) {
    var matType = req.params.matType;
    matType = (!matType) ? 10 : parseInt(matType);
    console.log("type = " + matType);
    status.logUser(req);
    getMatController(matType).getList(status.user.ID, matType, onGotList, onFail);
    function onGotList(list) {
        console.log(JSON.stringify(list));
        res.json(list);
    }

    function onFail(msg) {
        console.error("failed in get matList" + msg);
    }

});

function createMatId(req, res, matType, originalFilename) {
    if (!originalFilename) {
        var msg = "wrong format: must have filename!";
        console.log(msg);
        res.send(msg);
    } else {
        if (isNewMaterial(originalFilename)) {
            // 入库， 并获取新material ID，
            function onSavedToDB(_matId, path) {
                mat_id = _matId;
                var data = {
                    public_id: utils.matId2Name(mat_id)
                };
                cSignature.sign(data);
                if (path) {
                    data.existPath = path;
                }
                sendBack(data, res);
            }

            // ToDo:
            var ip = null;
            var isShared = false;
            getMatController(matType).add(status.user.ID, originalFilename, matType, ip, isShared, onSavedToDB, null);
        } else {
            console.log("must be new material");
        }
    }
}

function updateMatId(req, res, matType, matId, path) {
    // 入库， 并获取新material ID，
    function onSavedToDB(docId) {
        var data = {
            public_id: utils.matId2Name(docId)
        };
        sendBack(data, res);
    }

    getMatController(matType).update(matId, path, onSavedToDB);
}

function banMatId(req, res, matType, matId) {
    function onSavedToDB(docId) {
        var data = {
            public_id: utils.matId2Name(docId)
        };
        sendBack(data, res);
    }

    getMatController(matType).ban(matId, onSavedToDB);
}

function getMatIds(req, res, matType) {
    // ToDo:
    getMatController(matType).get(status.user.ID, function(data) {
        res.json(data);
    });
}

function sendBack(data, res) {
    res.send(data);
}

// private functions:
//ToDo: @@@
function isNewMaterial(mat_id) {
    return true;
}

function getMatType(req) {
    return req.body.type || TYPE_BKG_IMAGE;
}

function getMatController(type) {
    return (type === TYPE_SOUND) ? audioMatController : pictureMatController;
}
module.exports = router;
