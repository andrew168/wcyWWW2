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
WCY.$injection = ['$http', 'FileService', 'WxService', 'NetService'];

function WCY($http, FileService, WxService, NetService) {
    // 类的私有变量， 全部用_开头， 以区别于函数的局部变量
    var user = userProfile.user;
    var _AUTO_SAVE_NAME = '_auto_save_name_';
    var _FILENAME = '_filename_';
    var readCache = TQ.Base.Utility.readCache;
    var writeCache = TQ.Base.Utility.writeCache;

    var _wcyId = -1, // 缺省-1， 表示没有保存的作品。，12345678;
        _shareCode = null,
        _ssSign = null,
        _onStarted = null;


    function create(option) {
        if (currScene && !currScene.isSaved) {
            return save().then(function() {
                create(option);
                currScene.isSaved = true; // 数据已经保存，到内存， 网络上传还需要时间
            });
        }

        if (!option) {
            option = {};
        }
        _wcyId = 0;
        _shareCode = null;
        TQ.SceneEditor.createScene(option);
        startAutoSave();
    }

    function save() {
        if (TQ.Config.LocalCacheEnabled) {
            saveToCache();
        }
        //ToDo: if (has wifi)
        return _upload().then(_onUploadedSuccess, _onFail);
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
    function getWcy(shareString) {
        var url = TQ.Config.OPUS_HOST + '/wcy/' + shareString;
        $http.get(url)
            .then(_onReceivedWcyData, _onFail);
    }

    function getWcyList() {
        var url = TQ.Config.OPUS_HOST + '/wcylist/';
        $http.get(url)
            .then(_onReceivedWcyList, _onFail);

        function _onReceivedWcyList(res) {
            var data = res.data;
            if (data) {
                console.log(data);
            } else {
                TQ.Log.error("wrong logic");
            }
        }
    }

    function getShareCode() {
        return _shareCode;
    }

    function getScreenshotUrl() {
        return (!currScene.ssPath) ? null: currScene.ssPath;
    }

    function _upload() {
        TQ.Assert.isDefined(_wcyId);
        _wcyId = (_wcyId === -1) ? 0 : _wcyId;
        TQ.Assert.isTrue(_wcyId >= 0);
        var jsonWcyData = currScene.getData();
        var myToken = '1234567890';
        var params = '?wcyId=' + _wcyId;
        return $http({
            method: 'POST',
            // url: AUTH_HOST + wechat/sign?url=' + url,
            url: TQ.Config.OPUS_HOST + '/wcy' + params,
            headers: {
                // 'Token' : myToken, // 必须同源，才能用Token
                'Content-Type': 'application/json'
            },
            data: jsonWcyData
        });
    }

    function uploadScreenshot() {
        var data = TQ.ScreenShot.getData();
        TQ.AssertExt.invalidLogic(!!_ssSign);
        NetService.doUploadImage(_ssSign, data).
            then(updateSsPath).
            then(_onUploadedSuccess, function (err){
                TQ.Log.error("error in update ssPath!" + err);
            });
    }

    function updateSsPath(pkg) {
        TQ.AssertExt.invalidLogic(pkg.status === 200);

        var data2 = {
            ssPath: TQ.RM.toRelative(pkg.data.url),
            wcyId: _wcyId
        };

        var url = TQ.Config.OPUS_HOST + '/wcy/ssPath';
        return $http.post(url, angular.toJson(data2));
    }

    //ToDo： 在Server端实现, 记录播放的次数，(client端是不可靠的， 可能被黑客的）
    function edit(sceneID) {
        TQ.WCY.isPlayOnly = false;
        return _load(sceneID);
    }

    function show(sceneID) {
        TQ.WCY.isPlayOnly = true;
        return _load(sceneID);
    }

    function start(wcyCacheName) {
        if (!wcyCacheName) {
            wcyCacheName = _AUTO_SAVE_NAME;
        }
        var previousSaved = readCache(wcyCacheName);
        if (previousSaved) {
            var filename = readCache(_FILENAME);
            var fileInfo = {name: filename, content: previousSaved};
            _open(fileInfo);
        } else {
            create();
        }
    }

    // private function:
    function _load(sceneID) {
        var filename = "p14959.wdm"; // straw berry
        var content = null;

        if (sceneID) {
            filename = 'p' + sceneID + '.wdm';
        }

        var url = 'http://bone.udoido.cn/wcy/wdmOpen?filename=' + filename;
        if (!content) {
            $http.get(url, {})
                .success(function (data, status, headers, config) {
                    console.log(data);
                    content = JSON.stringify(data);
                    _openInJson(data);
                }).error(function (data, status, headers, config) {
                    console.log(data);
                });
        } else {
            var fileInfo = {name: filename, content: content};
            _open(fileInfo);
        }
    }

    function _open(fileinfo) {
        $("#Container").css("width", TQ.Config.validPageWidth.toString() + "px");
        // setStageSize(600, 480);
        //ToDo:@UI  initCreateEnvironment(TQ.WCY.isPlayOnly);
        TQ.SceneEditor.openWcy(fileinfo);
        initToolbar();
        TQ.FloatToolbar.initialize();
        // TQ.FloatToolbar.isVisible();
        startAutoSave();
        if (_onStarted) {
            _onStarted();
        }
    }

    function _autoSave() {
        if (_autoSaveStopped || currScene.hasSavedToCache) {
            return;
        }

        TQ.Assert.isObject(currScene);
        var data = currScene.getData();
        writeCache(_AUTO_SAVE_NAME, data);
        writeCache(_FILENAME, currScene.filename);
        currScene.hasSavedToCache = true;
    }

    var _autoSaveInitialized = false;
    var _autoSaveStopped = true;
    var _autoSavingInterval;
    function startAutoSave() {
        if (_autoSaveInitialized) {
            _stopAutoSave();
        }

        if (!TQ.Config.AutoSaveEnabled) {
            return;
        }

        _autoSaveInitialized = true;
        _autoSaveStopped = false;
        _autoSavingInterval = setInterval(_autoSave, 30000); // 30s
    }

    function _stopAutoSave() {
        if (_autoSavingInterval) {
            _autoSaveStopped = true;
            clearInterval(_autoSavingInterval);
            _autoSavingInterval = null;
        }
    }

    function _onUploadedSuccess(res) {
        var data = res.data;
        if (!!data) {
            if (!!data.wcyId) {
                _wcyId = _getWcyId(data);
            }

            if (!!data.shareCode) {
                _shareCode = data.shareCode;
                if (TQ.Config.hasWx) { //  更新微信的shareCode， 以供用户随时分享。
                    WxService.shareMessage(_shareCode);
                }
            }

            if (!!data.ssSign) {
                _ssSign = data.ssSign;
            }

            if (!!data.ssPath) {
                if (!currScene.ssPath) {
                    currScene.ssPath = data.ssPath;
                    save();
                } else {
                    currScene.ssPath = data.ssPath;
                }
            }

            if ((!currScene.ssPath) && (!!data.ssSign)) {
                uploadScreenshot(); // 自动触发首次截屏上传
            }
        }

        currScene.isSaved = true;
        console.log(data);
    }

    function _getWcyId(resData) {
        if (resData && resData.wcyId) {
            return parseInt(resData.wcyId);
        }
    }

    function _onFail(data) {
        console.log(data);
    }

    function _onReceivedWcyData(res) {
        var data = res.data;
        if (!!data && !!data.wcyId) {
            _wcyId = _getWcyId(data);
        }

        _openInJson(data.data);
    }

    function _openInJson(content) {
        var filename = _findFileName(content),
            fileInfo = {name: filename, content: content};

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

    return {
        setOnStarted: setOnStarted,
        start: start,  // start a new one, or load previous one (edited or played)
        create: create,
        save: save,
        uploadScreenshot: uploadScreenshot,
        edit: edit,  // open for edit
        getWcy: getWcy,
        getWcyList: getWcyList,
        getShareCode: getShareCode,
        getScreenshotUrl: getScreenshotUrl,
        show: show,  // open for show only

        // old api will be depreciated
        test: show,
        createScene: create
    };
}
