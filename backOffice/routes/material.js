const { assert } = require("console");
const { timingSafeEqual } = require("crypto");

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
var express = require("express");
var router = express.Router();
var Const = require("../base/const");
var utils = require("../common/utils"); // 后缀.js可以省略，Node会自动查找，
var netCommon = require("../common/netCommonFunc");
var cSignature = require("../common/cloundarySignature"); // 后缀.js可以省略，Node会自动查找，
var status = require("../common/status");
var audit = require("./audit");
var fs = require("fs");
var authHelper = require("./authHelper");
var pictureMatController = require("../db/material/pictureMatController");
var audioMatController = require("../db/material/audioMatController");

var MAT_SHARE_FLAG_DEFAULT = false;

router.post("/", authHelper.ensureAuthenticated, function(req, res, next) {
  console.log("params: " + JSON.stringify(req.params));
  console.log("body: " + JSON.stringify(req.body));
  console.log("query: " + JSON.stringify(req.query));
  var public_id = req.body.public_id || null;
  var matType = getMatType(req);
  var path = req.body.path || null;
  var user = status.getUserInfo(req, res);
  if (!user) {
    return netCommon.notLogin(req, res);
  }

  status.logUser(user, req, res);
  var auditResult = audit.process(req);
  if (auditResult.isAudit) {
    if (!public_id) {
      if ((req.body._id != undefined) && (req.body._id >= 0)) {
        public_id = req.body._id;
      } else if ((req.body.id != undefined) && (req.body.id >= 0)) {
        public_id = req.body.id;
      } else {
        assert.ok(false, "素材的public_id缺失!");
      }
    }
    return banMatId(req, res, auditResult.newValues, matType, public_id);
  }

  if (!public_id) {
    var originalFilename = req.body.filename || "no_filename";
    var iComponentId = req.body.iComponentId || 0;
    createMatId(req, res, iComponentId, matType, originalFilename);
  } else {
    updateMatId(req, res, matType, utils.matName2Id(public_id), path);
  }
});

router.post("/attachTopic", authHelper.ensureAuthenticated, function(req, res, next) {
  var matId = req.body.matId || null;
  var topicId = req.body.topicId || null;
  var matType = getMatType(req);
  var user = status.getUserInfo(req, res);

  if (!user) {
    return netCommon.notLogin(req, res);
  }

  status.logUser(user, req, res);
  getMatController(matType).attachTopic(matType, matId, topicId, user, onSuccess, onError);

  function onSuccess(id, doc) {
    res.json(doc);
  }

  function onError(err) {
    res.json(err);
  }
});

router.post("/sprite", authHelper.ensureAuthenticated, function(req, res, next) {
  var matId = req.body.matId || null;
  var public_id = req.body.public_id || null;
  var extra = req.body.extra || null;
  var matType = getMatType(req);
  var user = status.getUserInfo(req, res);

  if (!user) {
    return netCommon.notLogin(req, res);
  }

  if (!matId) {
    matId = utils.matName2Id(public_id);
  }

  status.logUser(user, req, res);
  if (matType === Const.MAT_TYPE.SOUND) {
    getMatController(matType).addSprite(user, matId, extra, onSuccess, onError);
  } else {
    onError({ error: "sprite is not allowed for mat " + matType });
  }

  function onSuccess(id, doc) {
    res.json(doc);
  }

  function onError(err) {
    res.json(err);
  }
});

router.post("/detachTopic", authHelper.ensureAuthenticated, function(req, res, next) {
  var matId = req.body.matId || null;
  var topicId = req.body.topicId || null;
  var matType = getMatType(req);
  var user = status.getUserInfo(req, res);

  if (topicId) {
    topicId = Number(topicId);
  }

  if (!user) {
    return netCommon.notLogin(req, res);
  }

  status.logUser(user, req, res);
  getMatController(matType).detachTopic(matType, matId, topicId, user, onSuccess, onError);

  function onSuccess(id, doc) {
    res.json(doc);
  }

  function onError(err) {
    res.json(err);
  }
});

router.get("/", function(req, res, next) {
  console.log("params: " + JSON.stringify(req.params));
  console.log("body: " + JSON.stringify(req.body));
  console.log("query: " + JSON.stringify(req.query));

  // ToDo:@@@
  getMatIds(req, res, getMatType(req));
});

// 定义RESTFull API（路径）中的参数，形参
router.param("matType", function(req, res, next, id) {
  next();
});
// 定义RESTFull API（路径）中的参数，形参
router.param("topicId", function(req, res, next, id) {
  next();
});
router.param("requestAll", function(req, res, next, id) {
  next();
});

router.get("/list/:matType/topic/:topicId/option/:requestAll", authHelper.ensureAuthenticated, function(req, res, next) {
  var matType = req.params.matType;
  var requestAll = utils.getParamsBoolean(req.params.requestAll, false);
  topicId = req.params.topicId || null,
  user = status.getUserInfo2(req, res);

  if (!user) {
    return netCommon.notLogin(req, res);
  }

  if (topicId) {
    topicId = Number(topicId);
  }

  matType = (!matType) ? 10 : parseInt(matType);
  console.log("type = " + matType);
  status.logUser(user, req, res);
  getMatController(matType).getList(user.ID, matType, topicId, onGotList, user.canAdmin, requestAll);
  function onGotList(list) {
    // console.log(JSON.stringify(list));
    res.json(list);
  }
});

function createMatId(req, res, iComponentId, matType, originalFilename) {
  var user = status.getUserInfo(req, res);
  if (!user) {
    return netCommon.notLogin(req, res);
  }

  if (!originalFilename) {
    var msg = "wrong format: must have filename!";
    console.log(msg);
    res.send(msg);
  } else {
    if (isNewMaterial(originalFilename)) {
      // 入库， 并获取新material ID，
      function onSavedToDb(_matId, path) {
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
      var isShared = MAT_SHARE_FLAG_DEFAULT;
      getMatController(matType).add(user.ID, iComponentId, originalFilename, matType, ip, isShared, onSavedToDb, null);
    } else {
      console.log("must be new material");
    }
  }
}

function updateMatId(req, res, matType, matId, path) {
  // 入库， 并获取新material ID，
  function onSavedToDb(docId) {
    var data = {
      public_id: utils.matId2Name(docId)
    };
    sendBack(data, res);
  }

  getMatController(matType).update(matId, path, onSavedToDb);
}

function banMatId(req, res, newValues, matType, matId) {
  var user = status.getUserInfo(req, res);
  // 此处不必再验证user了，因为之前的外网函数已经验证过了！

  function onSavedToDb(result) {
    var data;
    if (result.error) {
      data = result;
    } else {
      docId = result;
      data = {
        public_id: utils.matId2Name(docId)
      };
    }
    sendBack(data, res);
  }

  getMatController(matType).ban(user, matId, newValues, onSavedToDb);
}

function getMatIds(req, res, matType) {
  var user = status.getUserInfo(req, res);
  if (!user) {
    return netCommon.notLogin(req, res);
  }

  getMatController(matType).get(user.ID, function(data) {
    res.json(data);
  });
}

function sendBack(data, res) {
  res.send(data);
}

// private functions:
// ToDo: @@@
function isNewMaterial(mat_id) {
  return true;
}

function getMatType(req) {
  if (!req.body.matType) {
    console.warn("需要定义 matType");
  }
  return req.body.matType || Const.MAT_TYPE.BKG_IMAGE;
}

function getMatController(type) {
  return (type === Const.MAT_TYPE.SOUND) ? audioMatController : pictureMatController;
}
module.exports = router;
