/*
区别：
  WCY： 提供作品级别的服务
  EditorService： 综合提供元素级别的服务， 并且调用WCY中的服务


WCY 服务： 提供wcy及其screenshot的创建、保存、编辑、展示等服务；
  * 首次保存的时候， 也保存一份截图（当前画面的）
  * 再次保存的时候， 不再自动保存截图，
  * 可以单独保存截图（更新， 会替换旧的）
  * ToDo：想法删除旧的截图， 节省空间， 确保它没有被分享出去， 在替换的时候， 放到待删除库
  * 保存截图的时候， 必须同时再更新WCY（确保其中的ssPath是最新的）。

   ? 统一管理在下面三个地方的存取：app本地文件， LocalStorage和远程服务器
   提供WCY的自动保存服务
   LocalStorage由于空间有限， 只提供当前文件的自动存储。
   app本地文件， 可以离线存储多个作品
   暂时，只有当在线的情况下， 点击“保存”，才上传到远程服务器。
   (ToDO：会自动找到未上传的WCY， 从app本地文件读取其数据和截屏， 上传到服务器)

   => start
   => createScene
   => edit
   => show
*/
angular.module('starter').factory("WCY", WCY);
WCY.$inject = ['$q', '$timeout', '$http', 'FileService', 'WxService', 'NetService'];

function WCY($q, $timeout, $http, FileService, WxService, NetService) {
  // 类的私有变量， 全部用_开头， 以区别于函数的局部变量
  var user = TQ.userProfile;
  var _AUTO_SAVE_NAME = '_auto_save_name_',
    isSaving = false,
    _FILENAME = '_filename_',
    _SHARE_CODE_ = '_shareCode',
    _WCY_ID_ = "_wcy_id",
    readCache = TQ.Base.Utility.readCache,
    writeCache = TQ.Base.Utility.writeCache,
    _wcyId = TQ.Config.INVALID_WCY_ID, // 缺省-1， 表示没有保存的作品。，12345678;
    _shareCode = null,
    _ssSign = null,
    _onStarted = null,
    levelThumbs = [],
    preloadedWcyData = null,
    isPreloadingWcy = false,
    getWcyCalled = false;

  function isSafe() {
    return TQ.StageBuffer.isEmpty();
  }

  function needToStop() {
    return (currScene && !!currScene.levels);
  }

  function create(option) {
    if (TQ.userProfile.loggedIn && needToSave()) {
      return save().then(function () {
        create(option); // 数据已经保存，到内存， 网络上传还需要时间
      }, _onFail);
    }

    if (needToStop()) {
      stop();
    }

    if (!option) {
      option = {};
    }
    setAsNew();
    levelThumbs.splice(0);
    TQ.SceneEditor.createScene(option);
    doStarted();
  }

  function setAsNew() {
    _wcyId = TQ.Config.INVALID_WCY_ID; // 能够从新分配一个作品ID
    _ssSign = null;
    _shareCode = null;
    writeCache(_SHARE_CODE_, _shareCode);
    writeCache(_WCY_ID_, _wcyId);
    if (currScene) {
      currScene.isShared = false;
      currScene.setFilenameById(TQ.Config.UNNAMED_SCENE_ID);
      writeCache(_FILENAME, currScene.filename);
    }
    TQ.State.isPlayOnly = false;
    TQ.State.isTopicIntro = false;
  }

  function stop() {
    TQ.TouchManager.stop(); // 防止之前被打开
    stopAutoSave();
  }

  function save(forkIt) {
    if (!TQ.userProfile.loggedIn) {
      return TQ.MessageBox.prompt("Login in first!");
    }
    if (TQ.Config.LocalCacheEnabled) {
      saveToCache();
    }

    if (currScene.isIComponent() && !currScene.isValidIComponent()) {
      return TQ.MessageBox.prompt('智能元件需要满足以下条件：一个场景:' + currScene.levelNum() +
        ', 一个根元素: ' + currScene.levels[0].elements.length);
    }

    //ToDo: if (has wifi)
    isSaving = true;
    TQ.MessageBox.promptNoFlash(TQ.Locale.getStr('Saving......'));
    return upload(forkIt).then(onSavedSuccess).finally(function () {
      isSaving = false;
      TQ.MessageBox.hide();
    });
  }

  function createHtmlPage(screenshotUrl) {
    var shareData = {
      ssPath: screenshotUrl,
      title: currScene.title,
      description: currScene.description
    };

    return $http({
      method: 'POST',
      url: TQ.Config.OPUS_HOST + '/wcy/' + _shareCode,
      data: shareData
    });
  }

  function saveToCache() {
    TQ.Assert.isObject(currScene);
    var data = currScene.getData();
    data = new Blob([data], {type: 'text/plain'});
    var fileName = TQ.Config.WORKS_CORE_PATH + "nn.wcy";
    FileService.saveFile(fileName, data,
      function onSuccess(e) {
        TQ.Log.info(fileName + " saved");
        currScene.isSaved = true;
      },
      function onError(e) {
        TQ.Log.error("出错：无法保存文件: " + fileName + JSON.stringify(e));
      });
  }

  function _getWcy(shareString) {
    if (TQ.userProfile.loggedIn && needToSave()) {
      return save().then(function () {
        _getWcy(shareString);
      });
    }

    if (needToStop()) {
      stop();
    }

    levelThumbs.splice(0);
    // TQ.MessageBox.showWaiting(TQ.Locale.getStr('is loading...'));
    if (!preloadedWcyData && !isPreloadingWcy) {
      doGetOpusFromServer(shareString).then(_onReceivedWcyData, _onFail);
    } else if (preloadedWcyData) {
      _onReceivedWcyData(preloadedWcyData);
      preloadedWcyData = null;
    } else {
      getWcyCalled = true;
    }
  }

  function preloadWcy() {
    var shareString = TQ.Utility.getShareCodeFromUrl();
    if (!shareString) {
      return;
    }

    isPreloadingWcy = true;
    doGetOpusFromServer(shareString)
      .then(function (res) {
        isPreloadingWcy = false;
        if (getWcyCalled) {
          _onReceivedWcyData(res);
        } else {
          preloadedWcyData = res;
        }
      }, _onFail);
  }

  function getWcyById(wcyId) { // 通过作品栏目调入到编辑器中
    return getWcy(TQ.Utility.wcyId2ShareCode(wcyId), false);
  }

  function getWcy(shareString) {
    if (currScene) {
      currScene.close();
      currScene.reset();
    }
    TQ.State.isTopicIntro = false;
    _getWcy(shareString);
  }

  function getTopicIntro(topic) {
    TQ.State.topic = topic;
    TQ.State.isTopicIntro = true;
    TQ.State.isPlayOnly = true;
    return _getWcy(TQ.Utility.wcyId2ShareCode(topic.introId), false);
  }

  function getShareCode() {
    return _shareCode;
  }

  function getScreenshotUrl() {
    return (!currScene.ssPath) ? null : TQ.RM.toFullPathFs(currScene.ssPath);
  }

  function hasSsPath() {
    return !!currScene.ssPath;
  }

  function upload(forkIt) {
    TQ.Assert.isDefined(_wcyId);
    _wcyId = (_wcyId === -1) ? 0 : _wcyId;
    TQ.Assert.isTrue(_wcyId >= 0);
    var jsonWcyData = currScene.getData();
    var myToken = '1234567890';
    var params = '?wcyId=' + _wcyId;
    return $http({
      method: 'POST',
      // url: AUTH_HOST + wechat/sign?url=' + url,
      url: TQ.Config.OPUS_HOST + '/wcy' + params + (forkIt ? "&fork=true" : ""),
      headers: {
        // 'Token' : myToken, // 必须同源，才能用Token
        'Content-Type': 'application/json'
        // 'Content-Type': 'text/plain'
      },
      data: jsonWcyData
    });
  }

  function uploadScreenshot(newScreenshot) {
    var q = $q.defer();
    if (!_ssSign) {
      setTimeout(function () {
        q.reject({errMsg:"failed to uploadScreen: !ssSign ", data:null});
      });
    } else {
      TQ.AssertExt.invalidLogic(!!_ssSign);
      if (newScreenshot) {
        doUpload(newScreenshot);
      } else {
        TQ.ScreenShot.getForPostAsync(doUpload);
      }
      function doUpload(data) {
        NetService.doUploadImage(_ssSign, data).then(
          function (res) {
            onUploadSsSuccess(res);
            q.resolve(res);
          }, function (err) {
            onErrorGeneral(err);
            q.reject(err);
          });
      }
    }

    return q.promise;
  }

  //ToDo： 在Server端实现, 记录播放的次数，(client端是不可靠的， 可能被黑客的）
  function edit(sceneId) {
    TQ.WCY.isPlayOnly = false;
    return _load(sceneId);
  }

  function forkIt() {
    currScene.isPlayOnly = false;
    TQ.WCY.isPlayOnly = false;
    setAsNew();
    return save(true); // 要求fork 当前作品 //服务器不处理
  }

  function cloneIt() { // clone 是fork自己
    setAsNew();
    save(true); // 要求fork 当前作品 //服务器不处理
  }

  function show(sceneId) {
    TQ.WCY.isPlayOnly = true;
    return _load(sceneId);
  }

  function start() {
    if (TQ.userProfile.loggedIn && needToSave()) {
      return save().then(function () {
        start();
      });
    }

    var previousSaved = TQ.Config.ignoreCachedFile ? null : readCache(_AUTO_SAVE_NAME, null);
    if (previousSaved) {
      _shareCode = readCache(_SHARE_CODE_, null);
      _wcyId = readCache(_WCY_ID_, TQ.Config.INVALID_WCY_ID);
      if (_shareCode && ((!_wcyId) || (_wcyId < 1))) {
        _wcyId = TQ.Utility.shareCode2Id(_shareCode);
      }
      var filename = readCache(_FILENAME, TQ.Config.UNNAMED_SCENE);
      var fileInfo = {name: filename, content: previousSaved};
      _open(fileInfo);
    } else {
      TQ.WCY.isPlayOnly = false; // 新创作的， 当然是可以修改的
      create();
    }
  }

  // private function:
  function _load(sceneId) {
    var filename = "p14959.wdm"; // straw berry
    var content = null;

    if (sceneId) {
      filename = 'p' + sceneId + '.wdm';
    }

    var url = TQ.Config.BONE_HOST + '/wcy/wdmOpen?filename=' + filename;
    if (!content) {
      $http.get(url, {})
        .success(function (data, status, headers, config) {
          TQ.Log.debugInfo(data);
          content = JSON.stringify(data);
          _openInJson(data);
        }).error(function (data, status, headers, config) {
        TQ.Log.debugInfo(data);
      });
    } else {
      var fileInfo = {name: filename, content: content};
      _open(fileInfo);
    }
  }

  function _open(fileinfo) {
    //ToDo:@UI  initCreateEnvironment(TQ.WCY.isPlayOnly);
    TQ.SceneEditor.openScene(fileinfo);
    doStarted();
  }

  function doStarted() {
    // initToolbar();
    TQ.FloatToolbar.initialize();
    // TQ.FloatToolbar.isVisible();
    if (_onStarted) {
      _onStarted();
    }
  }

  function _autoSave() {
    if (TQ.State.isInBkg || isSaving || _autoSaveStopped || currScene.hasSavedToCache ||
      !needToSave() || !currScene.ssPath || // 只有生成（提交）过1次之后，才允许自动保存，以避免产生太多的草稿和空白截屏
      !isSafe()) {
    } else {
      TQ.Assert.isObject(currScene);
      var data = currScene.getData();
      writeCache(_AUTO_SAVE_NAME, data);
      writeCache(_FILENAME, currScene.filename);
      currScene.hasSavedToCache = true;
      updateWxShareData();
      if (TQ.userProfile.loggedIn && isNewOpus()) {
        save();
      }
      updateThumbnail(levelThumbs, currScene.currentLevelId);
    }

    return $timeout(_autoSave, 30000); // 30s
  }

  function updateThumbnail(levelThumbs, levelId) {
    if (currScene.hasStaleThumbnail || !levelThumbs[levelId] || !levelThumbs[levelId].src) {
      TQ.ScreenShot.saveThumbnail(levelThumbs, levelId);
      currScene.hasStaleThumbnail = false;
      $timeout(null);
    }
  }

  var _autoSaveInitialized = false;
  var _autoSaveStopped = true;
  var _autoSavingTimeout;

  function startAutoSave() {
    if (_autoSaveInitialized) {
      stopAutoSave();
    }

    if (!TQ.Config.AutoSaveEnabled) {
      return;
    }

    _autoSaveInitialized = true;
    _autoSaveStopped = false;
    _autoSavingTimeout = _autoSave();
  }

  function stopAutoSave() {
    if (_autoSavingTimeout) {
      _autoSaveStopped = true;
      clearTimeout(_autoSavingTimeout);
      _autoSavingTimeout = null;
    }
  }

  function onUploadSsSuccess(res) {
    var data = (!res) ? null : res.data;
    if (!!data) {
      if (!!data.url) {
        currScene.setSsPath(data.url);
        // TQ.MessageBox.toast(TQ.Locale.getStr('screenshot uploaded successfully!'));
        save();
      }

      TQ.Log.debugInfo(data);
    }
  }

  function onSavedSuccess(res) {
    var data = (!res) ? null : res.data;
    currScene.isSaved = true;
    if (!!data) {
      parseCommonData(data);

      if (!!data.ssSign) {
        _ssSign = data.ssSign;
      }

      if (!!data.ssPath) {
        currScene.setSsPath(data.ssPath);
      }
      currScene.setFilenameById(data.wcyId);
      TQUtility.triggerEvent(document, TQ.EVENT.MAT_CHANGED, {matType: TQ.MatType.OPUS});
      TQUtility.triggerEvent(document.body, TQ.Scene.EVENT_SAVED);
      TQ.Log.debugInfo(data);
    }

    if (!res) {
      TQ.Log.error("为什么为null？  在save的时候？");
    }
  }

  function parseCommonData(data) { // the common data in both save and get
    if (!!data && !!data.wcyId) {
      _wcyId = _getWcyId(data);
      if (currScene && !currScene.hasFilename()) {
        currScene.setFilenameById(_wcyId);
      }
    } else {
      _wcyId = TQ.Config.UNNAMED_SCENE_ID;
    }

    if (!!data.shareCode) {
      _shareCode = data.shareCode;
    } else {
      _shareCode = null;
    }

    writeCache(_SHARE_CODE_, _shareCode);
    writeCache(_WCY_ID_, _wcyId);
  }

  function onUrlChanged() {
    updateWxShareData();
  }

  function updateWxShareData() { // 在页面url更新之后， 才能初始化微信分享
    if (TQ.Config.hasWx && _shareCode && (_wcyId > 0)) { //  更新微信的shareCode， 以供用户随时分享。
      WxService.init(composeWxShareData(currScene, _shareCode));
    }
  }

  function composeWxShareData(scene, _shareCode) {
    var defaultShareForKids = {
      "title": '儿童创造能力提升',
      "description": '儿童创造能力提升--UDOIDO KIDZ'
    };

    TQ.Assert(_wcyId > 0, "必须先保存，才能调用");
    return {
      title: defaultShareForKids.title, // (scene.title) ? scene.title : "UdoIdo",
      ssPath: (scene.ssPath) ? TQ.RM.toFullPathFs(scene.ssPath) : null,
      desc: defaultShareForKids.description, // (scene.description) ? scene.description: null,
      code: (_shareCode) ? _shareCode : TQ.Utility.wcyId2ShareCode(_wcyId)
    }
  }

  function _getWcyId(resData) {
    if (resData && resData.wcyId) {
      return parseInt(resData.wcyId);
    }
  }

  function _onFail(data) {
    TQ.Log.debugInfo(data);
    TQ.MessageBox.prompt(TQ.Locale.getStr('hey, the network connection lost'));
  }

  function doGetOpusFromServer(shareString) {
    if (!shareString) {
      return;
    }

    var url = TQ.Config.OPUS_HOST + '/wcy/' + TQ.Utility.getShareCodeCore(shareString);
    return $http.get(url);
  }

  function getOutro(outroId) {
    return doGetOpusFromServer(TQ.Utility.wcyId2ShareCode(outroId))
      .then( _onReceivedOutroData, _onReceivedOutroData);
  }

  function _onReceivedWcyData(res) {
    TQ.MessageBox.reset();  // end of loading，no resource yet
    var data = res.data;
    parseCommonData(data);
    TQ.State.isPlayOnly = (TQ.State.isTopicIntro ? true : data.isPlayOnly);
    TQ.State.determineWorkingRegion();
    TQ.WCY.authorId = data.authorId;
    if (!!data.data) {
      _openInJson(TQ.Scene.decompress(data.data));
    }
  }

  function _onReceivedOutroData(res) {
    var outroData = (!res || !res.data || !res.data.data) ? null : res.data.data;
    if (outroData) {
      outroData = TQ.Scene.decompress(outroData);
      // upgrade
      outroData = JSON.parse(outroData);
      currScene.attachOutro(outroData);
    }
  }

  function _openInJson(content) {
    var filename = _findFileName(content),
      fileInfo = {name: filename, content: content};
    fileInfo.isPlayOnly = TQ.WCY.isPlayOnly;
    _open(fileInfo);
  }

  function _findFileName(data) {
    var content = JSON.parse(data);
    if (content.filename) return content.filename;
    return TQ.Config.UNNAMED_SCENE;
  }

  function setOnStarted(fn) {
    _onStarted = fn;
  }

  function onErrorGeneral(e) {
    TQ.Log.error("网络操作出错：" + JSON.stringify(e).substr(0, 250));
    TQ.MessageBox.reset();
  }

  function isNewOpus() {
    return (!_shareCode);
  }

  function needToSave() {
    return (currScene && (TQ.State && !TQ.State.isPlayOnly && !TQ.State.isTopicIntro) &&
      !currScene.isCurrentLevelEmpty() &&
      currScene.isAllDataReady() &&
      !currScene.isSaved);
  }

  return {
    levelThumbs: levelThumbs,
    updateThumbnail: updateThumbnail,
    setOnStarted: setOnStarted,
    start: start,  // start a new one, or load previous one (edited or played)
    create: create,
    needToSave: needToSave,
    save: save,
    createHtmlPage: createHtmlPage,
    forkIt: forkIt,
    cloneIt: cloneIt,
    setAsNew: setAsNew,
    startAutoSave: startAutoSave,
    stopAutoSave: stopAutoSave,
    uploadScreenshot: uploadScreenshot,
    edit: edit,  // open for edit
    getWcy: getWcy,
    getOutro: getOutro,
    preloadWcy: preloadWcy,
    getWcyById: getWcyById,
    getTopicIntro: getTopicIntro,
    getShareCode: getShareCode,
    getScreenshotUrl: getScreenshotUrl,
    hasSsPath: hasSsPath,
    onUrlChanged: onUrlChanged,
    show: show,  // open for show only

    // old api will be depreciated
    test: show,
    createScene: create
  };
}
