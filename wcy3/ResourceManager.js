/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 */
this.TQ = this.TQ || {};

(function() {
  // ToDo: RM内部只保存相对路径， 外部使用全路径。
  //      内部全部使用fullPath， 只有在保存文件的时候， 才使用相对路径， 既便于移植到不同的环节， 又能够唯一化代码
  // ToDo: 避免重复加入到Queue中，在addItem的时候， 如果已经在Queue中， 也不要加入，只处理其callback，
  // ToDo: 处理错误， 如果文件不存在， 则用"NoSound.wav" 或者“NoRes.png" 来替代。并执行其callback
  // ToDo: 加引用次数, 在内存不足的时候， 释放没有引用的资源
  // 资源管理器设计目标：
  //  * 预先加载资源，画面更流程，
  //  * 唯一化ID，避免重复加载:
  //  ** 一个资源，只加载1次，多次使用，在多个位置，多个角度
  //  ** 已经加载的资源， 用ID获取内容， 直接使用；
  //  ** 未加载的资源， 支持一对一的回调
  //  * 第一个Level加载完成之后， 马上开始播放该level， 同时， 继续加载后续的Level
  //  ** 如果当前Level加载没有完成， 则显示等待画面；
  //
  // 结构设计：
  // 1）level的资源， 及其回调函数（设置：dataReady）
  // 2）逐个加载每一个level，并且调用其回调函数，
  //
  // 已知的问题：
  //  1) preloadJS中的XHLLoader 会两次通过network加载同一资源， 只是第二次总是从cache中获取（从谷歌调试的network页面中看到）。
  //
  //

  function ResourceManager() {
  }

  var THUMBNAIL_EXP = "w_100,h_100,c_limit/";
  var OPUS_THUMBNAIL_EXP = "w_180,h_180,c_limit/";

  var urlParser = TQ.Base.Utility.urlParser;
  var urlConcat = TQ.Base.Utility.urlConcat;
  var maxConnectionsPerHost = 6;
  var RM = ResourceManager;

  RM.DATA_TYPE_SOUND = createjs.AbstractLoader.SOUND; // preloader lib中定义的
  RM.NOSOUND = "./mcSounds/p1.wav";
  RM.NOPIC = "./mcImages/p1.png";
  RM.BASE_PATH = null;
  // RM.BASE_PATH = "http://" + TQ.Config.DOMAIN_NAME;
  RM.BASE_PATH = TQ.DownloadManager.FAST_SERVER;
  // NOPIC和NOSOUND是基本的文件， 总是在本服务器（手机的本APP， desktop的本服务器）
  RM.FULLPATH_NOPIC = RM.NOPIC;
  RM.FULLPATH_NOSOUND = RM.NOSOUND;
  RM.isEmpty = true;
  RM.items = [];
  RM.preloader = {};
  RM.callbackList = [];
  RM.dataReady = false;
  RM.completeOnceHandlers = [];

  RM.initialize = function() {
    // var MAX_CONNECTIONS_PER_HOST={
    //    'chrome': 6,
    //    'safari': 6,
    //    'firefox': 6,
    //    'ie11': 8,
    //    'chrome mobile': 6,
    //    'safari mobile': 6,
    // };

    if (RM._hasCreated) { // 确保只创建一次
      return;
    }

    TQ.DownloadManager.initialize();
    RM._hasCreated = true;
    RM.hasDefaultResource = false;
    // Instantiate a queue.
    resetPreloader();
    _setupDefaultResource();
  };

  function _setupDefaultResource() {
    RM.hasDefaultResource = true;
    RM.addItem(RM.FULLPATH_NOPIC);
    RM.addItem(RM.FULLPATH_NOSOUND);
  }

  RM.setupListeners = function() {
    // Available PreloadJS callbacks
    var fileCounter = 0;
    RM.preloader.on("fileload", function(event) {
      var resId = event.item.id;
      var result = event.result;
      // ToDo: 唯一化断言
      RM.items[resId].res = result;
      RM.items[resId].type = event.item.type;
      fileCounter++;
      TQ.Log.info("Loaded: (" + fileCounter + "/" + Object.keys(RM.items).length + "): " + event.item.id);
      RM.onFileLoad(resId, result, event);
    });

    RM.preloader.addEventListener("complete", onCompleted);
    function onCompleted(event) {
      if (!event) {
        event = {};
      }
      // 下载没有完成， 但是预加载的已经完成了。
      if (!TQ.DownloadManager.hasCompleted()) {
        return;
      }
      TQ.Log.info(event.toString());
      RM.dataReady = true;
      var num = RM.completeOnceHandlers.length; // 防止动态添加的函数
      for (; num > 0; num--) {
        var handler = RM.completeOnceHandlers.shift();
        handler(event);
      }
      RM.isEmpty = true;
    }

    RM.onCompleted = onCompleted;
    RM.preloader.addEventListener("error", function(event) {
      var item = event.data;
      assertTrue("缺少系统文件",
        ((item.src !== RM.FULLPATH_NOSOUND) &&
                (item.src !== RM.FULLPATH_NOPIC)));
      TQ.Log.info(item.src + ": " + event.toString());
      TQUtility.triggerEvent(document, TQ.EVENT.SYSTEM_ERROR, { desc: event.title || "FILE_LOAD_ERROR", detail: event });
      var resId = item.id;
      var result = null;
      var altResId = null;

      switch (item.type) {
        case createjs.LoadQueue.IMAGE:
          altResId = RM.FULLPATH_NOPIC;
          break;

        case createjs.LoadQueue.SOUND:
          altResId = RM.FULLPATH_NOSOUND;
          break;

        case createjs.LoadQueue.TEXT: // 元件的文件, or bad file
          if (TQ.Utility.isImage(item.src)) {
            altResId = RM.FULLPATH_NOPIC;
            item.type = createjs.LoadQueue.IMAGE;
          } else if (TQ.Utility.isSoundResource(item.src)) {
            altResId = RM.FULLPATH_NOSOUND;
            item.type = createjs.LoadQueue.SOUND;
          } else {
            TQ.Log.error(item.type + ": 未处理的资源类型!");
          }
          break;
        case createjs.LoadQueue.VIDEO:
          altResId = "";
          item.type = createjs.LoadQueue.VIDEO;
          break;

        default :
          TQ.Log.error(item.type + ": 未处理的资源类型!");
      }

      if ((altResId != null) && (!!RM.items[altResId])) {
        result = RM.items[altResId].res;
      } else {
        assertTrue(TQ.Dictionary.INVALID_LOGIC, false);
      }

      RM.items[resId] = { ID: resId, res: result, type: item.type };
      if (result == null) {
        RM.addItem(altResId, function() {
          var item = RM.items[resId];
          var altItem = RM.items[altResId];

          if (item && altItem) {
            item.res = altItem.res;
            item.altResId = altItem.ID;
          } else {
            TQ.Log.error("RM.items error: resId = " + resId + " altResId=" + altResId);
          }
        });

        assertTrue(TQ.Dictionary.INVALID_LOGIC, false);
      } else {
        RM.items[resId].altResId = RM.items[altResId].ID;
        RM.onFileLoad(resId, result, null);
      }
    });

    RM.preloader.addEventListener("progress", function(event) {
      // TQ.Log.info("." + event.toString() + ": " + event.loaded);
    });
    RM.dataReady = false;
  };

  RM.onFileLoad = function(resId, result, event) {
    // check for callback
    for (var i = 0; i < RM.callbackList.length; i++) {
      if (RM.callbackList[i].ID === resId) {
        TQ.Log.info("find immediate call back to do");
        var item = RM.callbackList.splice(i, 1);
        item[0].func(event);
        i--;
      }
    }
  };

  RM.getId = function(item) {
    if (!item.altResId) {
      return item.ID;
    } else {
      return item.altResId;
    }
  };

  // 清除所有的资源，准备开始新的微创意
  RM.reset = function() {
    if (!RM._hasCreated) {
      return;
    }
    RM.completeOnceHandlers.splice(0);
    RM.preloader.removeAllEventListeners();
    RM.preloader.removeAll();
    RM.preloader.cancel();
    RM.preloader = null;
    resetPreloader();
    // RM.items.splice(0); 不行，因为不是数组，
    for (var item in RM.items) {
      if (Object.prototype.hasOwnProperty.call(RM.items, item)) {
        delete RM.items[item];
      }
    }
    RM.isEmpty = true;
  };

  function resetPreloader() {
    RM.preloader = new createjs.LoadQueue(true, null, true); // , "assets/");
    RM.preloader.setMaxConnections(maxConnectionsPerHost);

    if (TQ.Base.Utility.isMobileDevice()) {
      RM.preloader.installPlugin(createjs.CordovaAudioLoader);
    }
    RM.setupListeners();
  }

  // 信号：暂停预加载，以便于处理时间敏感的判定， 必须是短时间
  RM.setPaused = function(value) {
    RM.preloader.setPaused(value);
  };

  // 完成加载的顺序与开始加载顺序无关。 最先开始加载的资源， 如果很大，最后才加载完成。 如果后开始加载的资源下。
  // 只有遍历
  RM.on = function(eventName, callback) {
    RM.preloader.addEventListener(eventName, callback);
  };

  RM.onCompleteOnce = function(callback) {
    RM.completeOnceHandlers.push(callback);
  };

  RM.removeEventListener = function(eventName, callback) {
    RM.preloader.removeEventListener(eventName, callback);
  };

  function _addReference(resourceId, _callback) {
    var item = RM.getResource(resourceId);
    assertTrue("_addReference: 先确保resource 存在！", !!item);
    if (_callback) {
      RM.callbackList.push({ ID: resourceId, func: _callback });
    }

    // ToDo:@@@ 增加和减少 reference Counter
  }

  RM.addItem = function(resourceId, _callback) {
    if (isAudio(resourceId)) {
      return;
    }

    TQ.Assert.isTrue(RM.hasDefaultResource, "没有初始化RM！");
    resourceId = _toKeyPath(resourceId);
    if (_hasResource(resourceId)) {
      assertTrue("RM.addItem: check resource ready before call it!!", !this.hasResourceReady(resourceId));
      _addReference(resourceId, _callback);
    } else {
      var resourcePath = composeResourcePath(resourceId);
      TQ.Assert.isNotNull(resourcePath, "不支持的逻辑!");
      if (resourcePath) {
        loadResource(resourcePath, resourceId, null, _callback);
      }
    }
  };

  function loadResource(resourcePath, resourceId, type, _callback) {
    if (TQUtility.isVideoUrl(resourcePath) || TQUtility.isVideoFile(resourcePath)) {
      type = createjs.AbstractLoader.VIDEO; // 'video'
    }
    // 添加Item 到预加载队列中， 并启动运行预加载（如果没有运行的话）
    // ToDo: RM.Items.push({});
    RM.items[resourceId] = { ID: resourceId, res: null, type: type };

    if (_callback) {
      RM.callbackList.push({ ID: resourceId, func: _callback });
    }

    // RM.preloader.loadFile("assets/image0.jpg");
    RM.dataReady = false;
    RM.isEmpty = false;
    addToPreloader(resourcePath, resourceId, type);
  }

  function loadSoundFromFile(aFile, callback) {
    var resourcePath = TQUtility.fileToUrl(aFile, {});
    loadResource(resourcePath, resourcePath, RM.DATA_TYPE_SOUND, callback);
  }

  var cloudinarySubdomains = [
    "res.cloudinary.com",
    "res-3.cloudinary.com"];

  function accelerateByMultiHost(fullPath) {
    var mainHost = "res.cloudinary.com";
    if (fullPath.indexOf(mainHost) > -1) {
      try {
        var idIndex = fullPath.lastIndexOf(".");
        var fileId = parseInt(fullPath[idIndex - 1]) % 2;
        return fullPath.replace(mainHost, cloudinarySubdomains[fileId]);
      } catch (e) {

      }
    }
    return fullPath;
  }

  function addToPreloader(fullPath, resourceId, type) {
    RM.preloader.loadManifest([{
      type: type, // 对于本地声音， 必须加，因为blob类的url无法提供类别信息
      src: (TQ.Config.useCloudinaryMultiHost ? accelerateByMultiHost(fullPath) : fullPath),
      id: resourceId, // Sound资源的id是字符串, 不是数字
      data: 3 // 本资源最大允许同时播放N=3个instance。（主要是针对声音）
    }]);
  }

  function composeResourcePath(resourceId) {
    var resourcePath = null;
    function makeOnSuccess1(fullPath, ID) {
      return function() {
        addToPreloader(fullPath, ID);
      };
    }

    TQ.Assert.isTrue(resourceId.indexOf("imgcache") !== 0);
    // 先从本App的服务器下载， 没有的话， 在从File Server下载
    if (_isLocalFileSystem(resourceId)) {
      resourcePath = resourceId;
    } else {
      if (TQ.Config.LocalCacheEnabled) {
        TQ.Assert.isTrue(false, "ToDo: 需要重新修改");
        var cacheName = toCachePath(resourceId);
        if (TQ.DownloadManager.hasCached(resourceId)) {
          resourcePath = cacheName;
        } else {
          var onSuccess = makeOnSuccess1(cacheName, resourceId);
          TQ.DownloadManager.downloadAux(resourceId, cacheName, onSuccess, function() {
            TQ.Log.error(resourceId + "资源加载出错！");
          });
        }
      } else {
        resourcePath = _toFullPath(resourceId);
      }
    }
    return resourcePath;
  }

  /*
     如果成功地送到RM， 则返回true；对于有多个资源的情况，只有送入1个就返回true。
     如果没有送入RM， （比如:RM中已经有了）， 则 返回false
     */
  RM.addElementDesc = function(desc, callback) {
    TQ.AssertExt.isNotNull(desc);
    if (!desc) return false;
    var allChildrenReady = !(desc.children && desc.children.length > 0);
    var iReady = !desc.src;

    tryCallback(); // 预防空的元素

    if (!allChildrenReady) { // 先调入子孙的资源， 以便于执行callback
      var numOkChildren = 0;
      var numChildren = desc.children.length;
      function onChildReady() {
        numOkChildren++;
        if (numOkChildren >= numChildren) {
          allChildrenReady = true;
          tryCallback();
        }
      }
      for (var i = 0; i < numChildren; i++) {
        if (!desc.children[i]) {
          continue;
        }
        RM.addElementDesc(desc.children[i], onChildReady);
      }
    }

    if (!iReady) { // 处理自己的资源
      var resName = desc.src;
      iReady = RM.hasResourceReady(resName);
      if (iReady) {
        onIReady();
      } else {
        RM.addItem(resName, onIReady);
      }
    }

    function tryCallback() {
      if (allChildrenReady && iReady && callback) {
        callback();
      }
    }

    function onIReady() {
      iReady = true;
      tryCallback();
    }

    return allChildrenReady && iReady;
  };

  RM.addElementDescList = function(jsonElements) {
    var foundInvalidElement = false;
    for (let i = 0; i < jsonElements.length; i++) {
      var desc = jsonElements[i];
      if (!desc || isBlob(desc)) {
        foundInvalidElement = true;
        jsonElements[i] = null;
      } else {
        desc.src = TQUtility.unifyFormat(desc.type, desc.src);
        TQ.RM.addElementDesc(desc);
      }
    }

    if (foundInvalidElement) { // 删除非法element
      for (let i = jsonElements.length - 1; i >= 0; i--) {
        if (!jsonElements[i]) {
          jsonElements.splice(i, 1);
        }
      }
    }
  };

  RM.isLocalResource = function(resName) {
    return (resName.indexOf("file:///") === 0);
  };

  /*
     只要差一个资源未调入RM， 都必须返回false，
     */
  RM.hasElementDesc = function(desc) {
    TQ.AssertExt.isNotNull(desc);
    if (!desc) return true;
    var result = true;

    if (desc.children) { // 先调入子孙的资源， 以便于执行callback
      for (var i = 0; i < desc.children.length; i++) {
        TQ.Assert.isTrue(false, "addElementDesc or hasElementDesc???");
        if (!desc.children[i]) {
          continue;
        }
        if (RM.addElementDesc(desc.children[i])) {
          result = false;
        }
      }
    }

    if (desc.src) { // 处理自己的资源
      return RM.hasResourceReady(desc.src);
    }

    // for virtual object;
    return result;
  };

  function _hasResource(id) { // registered, may not loaded
    TQ.Assert.isTrue(_isKeyPath(id), "应该是Key路径");
    return !(!RM.items[id]);
  }

  RM.hasResourceReady = function(id) {
    if (isAudio(id)) {
      return true;
    }
    var res = RM.items[_toKeyPath(id)];
    return (!!res && !!res.res);
  };

  RM.getResource = function(id) {
    if (isAudio(id)) {
      return { ID: id };
    }

    id = _toKeyPath(id);
    if (!RM.items[id]) { // 没有发现， 需要调入
      TQ.Log.info(id + ": 没有此资源, 需要加载, 如果需要回调函数，用 addItem 替代 getResource");
      // 添加到预加载列表中
      // 设置回调函数
      return null;
    }

    return RM.items[id];
  };

  RM.toRelative = function(str) {
    if (_isLocalFileSystem(str)) {
      return str;
    }

    if (!_isFullPath(str)) {
      str = _removeMatFolder(str);
      str = _removeFirstSeperator(str);
      str = _removeImgCacheString(str);
      TQ.Assert.isTrue((str[0] !== "\\") && (str[0] !== "/"),
        "相对路径，开头不能是\\或者/");
      return str;
    }

    if (TQ.Config.LocalCacheEnabled && _isCachePath(str)) {
      return _removeCacheRoot(str);
    }

    var pathname = urlParser(str).pathname;
    pathname = _removeMatFolder(pathname);
    pathname = handleAndroidLocalhost(pathname);
    return _removeFirstSeperator(pathname);
  };

  RM.toRelativeWithoutCache = function(str) {
    if (TQ.Config.LocalCacheEnabled && _isCachePath(str)) {
      return _removeCacheRoot(str);
    }
    return RM.toRelative(str);
  };

  RM.getNameFromUrl = function(url) {
    if (!url) {
      return url;
    }
    var words = url.split("/");
    return words[words.length - 1];
  };

  function handleAndroidLocalhost(pathname) {
    var ANDROID_LOCALHOST = "/android_asset/www";
    if (pathname.indexOf(ANDROID_LOCALHOST) === 0) {
      pathname = pathname.substr(ANDROID_LOCALHOST.length);
    }

    return pathname;
  }

  function _removeMatFolder(pathname) {
    if ((TQ.Config.IMAGES_CORE_PATH !== "") && (pathname.indexOf(TQ.Config.IMAGES_CORE_PATH) >= 0)) {
      pathname = pathname.substr(TQ.Config.IMAGES_CORE_PATH.length);
    }
    if ((TQ.Config.SOUNDS_PATH !== "") && (pathname.indexOf(TQ.Config.SOUNDS_PATH) >= 0)) {
      pathname = pathname.substr(TQ.Config.SOUNDS_PATH.length);
    }

    return pathname;
  }

  function _removeFirstSeperator(path) {
    if ((path[0] === "\\") || (path[0] === "/")) {
      return path.substr(1);
    }
    return path;
  }

  function _removeImgCacheString(pathname) {
    if (_isFullPath(pathname)) {
      return pathname;
    }

    var IMG_CACHE = "imgcache/";
    if (pathname.indexOf(IMG_CACHE) === 0) {
      pathname = pathname.substr(IMG_CACHE.length);
    }

    return pathname;
  }

  function toCachePath(path) {
    if (_isLocalFileSystem(path)) {
      return path;
    }

    var cachePath = _toStdFolder(RM.toRelative(path));
    return urlConcat(TQ.Config.getResourceHost(), cachePath);
  }

  function _isCachePath(path) {
    return (path.indexOf(TQ.Config.getResourceHost()) === 0);
  }

  function _removeCacheRoot(path) {
    return (path.substr(TQ.Config.getResourceHost().length));
  }

  function _toStdFolder(path) {
    var MAX_FILE_NAME = 50;
    var std_folder;

    if (TQ.Utility.isImage(path)) {
      std_folder = TQ.Config.SCREENSHOT_CORE_PATH;
      if (path.indexOf(std_folder) === 0) {
      } else {
        std_folder = TQ.Config.IMAGES_CORE_PATH;
        if (path.indexOf(std_folder) >= 0) {
        }
      }
    } else if (TQ.Utility.isSoundResource(path)) {
      std_folder = TQ.Config.SOUNDS_PATH;
    } else if (TQ.Utility.isVideo(path)) {
      std_folder = TQ.Config.VIDEOS_CORE_PATH;
    } else if (TQ.Utility.isWCY(path)) {
      std_folder = TQ.Config.WORKS_CORE_PATH;
    } else {
      TQ.Assert.isTrue(false, "未处理的文件类别!");
    }

    if (path.indexOf(std_folder) === 0) {
      return path;
    }

    // ToDo: get unique file ID, like p123456.png;
    path = path.replace(/\//g, "_");
    var start = path.length - MAX_FILE_NAME;
    if (start > 0) {
      path = path.substr(start);
    }

    return urlConcat(std_folder, path);
  }

  function _isFullPath(name) {
    var protocols = ["filesystem:", "file:", "http://", "https://"];
    for (var i = 0; i < protocols.length; i++) {
      if (name.indexOf(protocols[i]) === 0) {
        return true;
      }
    }

    if (urlParser(name).pathname === name) {
      return false;
    }

    TQ.Assert.isTrue(RM.BASE_PATH !== "", "BASE_PATH是空，");
    return (name.indexOf(RM.BASE_PATH) >= 0);
  }

  function _isLocalFileSystem(name) {
    return ((name.indexOf("filesystem:") === 0) ||
            (name.indexOf("file:///") === 0) ||
            TQUtility.isBlobUrl(name));
  }

  function _toFullPath(name) {
    if (!name) {
      name = "";
    }
    if (_isLocalFileSystem(name)) {
      return name;
    }

    if (_isFullPath(name)) {
      return name;
    }

    if (RM.FULLPATH_NOPIC.indexOf(name) > -1) {
      return RM.FULLPATH_NOPIC;
    }

    if (RM.FULLPATH_NOSOUND.indexOf(name) > -1) {
      return RM.FULLPATH_NOSOUND;
    }

    var folder = (TQ.Utility.isImage(name)) ? TQ.Config.IMAGES_CORE_PATH : TQ.Config.SOUNDS_PATH;
    var fullpath = urlConcat(urlConcat(TQ.Config.MAT_HOST, folder), name);
    if (RM.BASE_PATH !== "") {
      TQ.Assert.isTrue(urlParser(RM.BASE_PATH).hostname === urlParser(fullpath).hostname, "hostname 不一致");
    }
    return fullpath;
  }

  function _toFullPathLs(name) { // Local Server: the server I'm running
    if (_isLocalFileSystem(name) || _isFullPath(name)) {
      return name;
    }

    var fullpath = TQ.Base.Utility.urlComposer(name);
    return fullpath;
  }

  function _toKeyPath(path) {
    // 只有两种keypath：
    //      本地文件（全路径， 不论是否cache的），
    //      远程文件
    if (_isLocalFileSystem(path)) {
      return path;
    }
    return RM.toRelative(path);
  }

  function _isKeyPath(path) {
    if (_isLocalFileSystem(path)) {
      return true;
    }

    return !_isFullPath(path);
  }

  RM.toRelativeFromThumbnail = function(url) {
    var pathname = TQ.Base.Utility.urlParser(url).pathname;
    var parts = (!pathname) ? [] : pathname.split("/");
    return (parts.length < 2) ? url : parts[parts.length - 2] + "/" + parts[parts.length - 1];
  };

  RM.toMatFullPath = function(relativePath) {
    return TQ.Config.MAT_UPLOAD_API + "/" + relativePath;
  };

  RM.toMatThumbNailFullPath = function(relativePath) {
    return (!relativePath) ? null : RM.toFullPathFs(toThumbNail(relativePath));
  };

  RM.toOpusThumbNailFullPath = function(relativePath) {
    return (!relativePath) ? null : RM.toFullPathFs(toOpusThumbNail(relativePath));
  };

  RM.removeThumbNail = function(path) {
    return path.replace(THUMBNAIL_EXP, "").replace(OPUS_THUMBNAIL_EXP, "");
  };

  function toOpusThumbNail(path) {
    TQ.Assert.isTrue(path[0] !== "/", "not separator");
    return (TQ.Utility.isImage(path) ? OPUS_THUMBNAIL_EXP : "") + path;
  }

  function toThumbNail(path) {
    TQ.Assert.isTrue(path[0] !== "/", "not separator");
    return (TQ.Utility.isImage(path) ? THUMBNAIL_EXP : "") + path;
  }

  function isBlob(desc) {
    return desc && desc.src && TQUtility.isBlobUrl(desc.src);
  }

  function isAudio(id) {
    return (id.indexOf(".mp3") >= 0);
  }

  RM.loadSoundFromFile = loadSoundFromFile;
  RM.toCachePath = toCachePath;
  RM.toFullPathFs = _toFullPath;
  TQ.RM = RM;
  TQ.ResourceManager = RM;
}());
