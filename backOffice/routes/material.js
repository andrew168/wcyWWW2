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

var TYPE_IMAGE = 'image',
    TYPE_AUDIO = 'audio';

router.post('/', function(req, res, next) {
    console.log("params: " + JSON.stringify(req.params));
    console.log("body: " + JSON.stringify(req.body));
    console.log("query: " + JSON.stringify(req.query));
    var public_id = req.param('public_id') || null,
        matType = getMatType(req);
    status.checkUser(req, res);
    if (!public_id) {
        var originalFilename = req.param('filename') || "no_filename";
        createMatId(req, res, matType, originalFilename);
    } else {
        var path = req.param('path') || null;
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

router.get('/list', function(req, res, next) {
    status.checkUser(req, res);
    pictureMatController.getList(status.user.ID, onGotList, onFail);
    function onGotList(list) {
        console.log(list);
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
            function onSavedToDB(_matId) {
                mat_id = _matId;
                var data = {
                    public_id: utils.matId2Name(mat_id)
                };
                cSignature.sign(data);
                sendBack(data, res);
            }

            // ToDo:
            var ip = null;
            var isShared = false;
            getMatController(matType).add(status.user.ID, originalFilename, ip, isShared, onSavedToDB, null);
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
    var matType = req.param('type') || TYPE_IMAGE;
    return matType.split('/')[0];
}

function getMatController(type) {
    return (type === TYPE_IMAGE) ? pictureMatController : audioMatController;
}
module.exports = router;
