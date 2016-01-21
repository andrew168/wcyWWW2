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

var fs = require('fs');

var pictureMatController = require('./pictureMatController');
var audioMatController = require('./audioMatController');

var TYPE_IMAGE = 'image',
    TYPE_AUDIO = 'audio';

var userID,
    timesCalled,
    defaultUserID = 1000;


router.post('/', function(req, res, next) {
    console.log("params: " + JSON.stringify(req.params));
    console.log("body: " + JSON.stringify(req.body));
    console.log("query: " + JSON.stringify(req.query));
    //ToDo:@@@
    var userID = 0;
    var public_id = req.param('public_id') || null,
        matType = getMatType(req);

    if (!public_id) {
        var originalFilename = req.param('filename') || "no_filename";
        createMatId(matType, originalFilename, res);
    } else {
        var path = req.param('path') || null;
        updateMatId(matType, public_id, path, res);
    }
});

router.get('/', function(req, res, next) {
    console.log("params: " + JSON.stringify(req.params));
    console.log("body: " + JSON.stringify(req.body));
    console.log("query: " + JSON.stringify(req.query));

    //ToDo:@@@
    var userID = 0;
    getMatIds(getMatType(req), res);
});

function createMatId(matType, originalFilename, res) {
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
                    public_id: mat_id
                };
                cSignature.sign(data);
                sendBack(data, res);
            }

            // ToDo:
            var ip = null;
            var isShared = false;
            getMatController(matType).add(userID, originalFilename, ip, isShared, onSavedToDB, null);
        } else {
            console.log("must be new material");
        }

    }
}

function updateMatId(matType, public_id, path, res) {
    // 入库， 并获取新material ID，
    function onSavedToDB(_matId) {
        var data = {
            public_id: _matId
        };
        sendBack(data, res);
    }

    getMatController(matType).update(public_id, path, onSavedToDB);
}

function getMatIds(matType, res) {
    // ToDo:
    getMatController(matType).get(null, function(data) {
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
