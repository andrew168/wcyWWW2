/**
 * Created by admin on 9/18/2015.
 */
var TQ = TQ || {};
TQ.Base = TQ.Base || {};
var TQUtility; //

(function() {
  function Utility() {
  }

  var urlAPI = (window.createObjectURL && window) ||
        (window.URL && URL.revokeObjectURL && URL) ||
        (window.webkitURL && webkitURL);

  Utility.isIOS = isIOS;
  Utility.isAndroid = isAndroid;
  Utility.isAndroidPad = isAndroidPad;
  Utility.isIPad = isIPad;
  Utility.isPad = isPad;
  Utility.isWeChat = isWeChat;
  Utility.isMiniProgramWebView = isMiniProgramWebView;
  Utility.parsePathname = parsePathname;
  Utility.isLandscape = isLandscape;

  Utility.isObject = function(obj) {
    return (typeof obj === 'object');
  };

  Utility.isPC = function () { // including windows and mac
    return !isIOS() && !isAndroid();
  };

  function isAndroid() {
    return ionic.Platform.isAndroid();
  }

  function isAndroidPad() {
    var w = window.screen.width,
      h = window.screen.height,
      width = Math.max(w, h),
      height = Math.min(w, h);

    return isAndroid() && (width > 850 && height > 600);
  }

  function isIPad() {
    return ionic.Platform.isIPad();
  }

  function isPad() {
    return ionic.Platform.isIPad() || isAndroidPad();
  }

  function isIOS() { // only mobile, pad, no mac
    return ionic.Platform.isIOS();
  }

  function isWeChat() {
    // 微信在 Android和iPhone 下的 User Agent分别是：
    // mozilla/5.0 (linux; u; android ......micromessenger/5.0.1.352
    // mozilla/5.0 (iphone; ...... micromessenger/5.0
    var ua = navigator.userAgent.toLowerCase();
    return /micromessenger/.test(ua);
  }

  function isMiniProgramWebViewDevTool() {
    // 微信在 Android和iPhone 下的 User Agent分别是：
    // mozilla/5.0 (linux; u; android ......micromessenger/5.0.1.352
    // mozilla/5.0 (iphone; ...... micromessenger/5.0
    var ua = navigator.userAgent.toLowerCase();
    return isWeChat() && /webdebugger miniprogramhtmlwebview/.test(ua);
  }

  function isMiniProgramWebView() { //在微信小程序打开的webView
    return (window && !!window.__wxjs_environment &&
            (window.__wxjs_environment === "miniprogram"));
  }

  function isLandscape () {
    if (isMiniProgramWebView() && isMiniProgramWebViewDevTool()) {
      return isMiniProgramWebViewSimulatorLandscape();
    }

    var flags = ''; // "landscape-primary", "portrait-primary"
    if (screen && screen.orientation && screen.orientation.type) {
      flags = screen.orientation.type;
    }
    return (flags.indexOf('landscape') >=0);
  }

  function isMiniProgramWebViewSimulatorLandscape() {
    //！！！ 在微信开发工具的模拟手机中， screen值是整个桌面， 所以，只能用window的信息
    TQ.AssertExt.invalidLogic(isMiniProgramWebView() && isMiniProgramWebViewDevTool(), "只能在微信开发工具中调试小程序的时候使用");
    return (window && window.innerHeight && window.innerWidth &&
            (window.innerWidth > window.innerHeight));
  }

  function getVersionNumber() {
    if (!window.device) {
      return 0;
    }

    return versionToNum(window.device.version);
  }

  function versionToNum(version) {
    var arr = version.split('.');
    while (arr.length < 2) {
      arr.push(0);
    }

    return (arr[0] * 1000 + arr[1]);
  }

  Utility.isFullySupported = function() {
    if (Utility.isPC()) {
      return true;
    } else if (isAndroid()) {
      return (getVersionNumber() >= versionToNum('4.1'));
    } else if (isIOS()) {
      return true;
    }

    return false;
  };

  Utility.isCordovaDevice = function() {
    return (typeof cordova !== "undefined"); //Chrome simulator返回false
  };

  Utility.isMobileDevice = function() {
    // 是真正的 mobile设备， 不是 Chrome的仿真
    return (Utility.isCordovaDevice() &&
            (ionic.Platform.isAndroid() ||
            ionic.Platform.isIOS() ||
            ionic.Platform.isWebView() ||
            ionic.Platform.isWindowsPhone()));
  };

  Utility.isMobile = function () {
    // 不论是真正的 mobile设备， 还是 Chrome的仿真
    return isAndroid() || isIOS();
  };

  Utility.triggerEvent = function (DomElement, eventName, data) {
    // TQ.Log.debugInfo("triggerEvent,  CustomEvent: " + typeof CustomEvent + ", " + eventName);
    var evt = new CustomEvent(eventName);
    if (!!data) {
      evt.data = data;
    }
    // TQ.Log.debugInfo("event = :" + JSON.stringify(evt));
    DomElement.dispatchEvent(evt);
  };

  // 下面的情况下，有误：
  // TQ.Base.Utility.urlParser('filesystem:http://localhost:8100/temporary/imgcache//mcImages/p10324.png');
  // TQ.Base.Utility.urlParser('unsafe:filesystem:http://localhost:8100/temporary/imgcache//mcImages/p10324.png');
  Utility.urlParser = function(url) {
    var parser = document.createElement('a');
    parser.href = url;
    return parser;
  };

  function parsePathname(url) {
    return Utility.urlParser(url).pathname;
  }

  Utility.urlComposer = function(path, host, protocol) {
    var ANDROID_PATH_PREFIX = '/android_asset/www';
    var parser = Utility.urlParser(path);

    if (!protocol) {
      protocol = parser.protocol;
    }

    if (!host) {
      host = parser.host;
      if (ionic.Platform.isAndroid()) {
        if (TQ.Base.Utility.isCordovaDevice()) {
          TQ.Assert.isTrue(host==="", "android app的host为空！");

          // ANDROID_PATH_PREFIX: 只在相对路径时候自动添加前缀，
          // 若是‘/'开头（即：绝对路径），则不自动添加前缀
          if (!(parser.pathname.indexOf(ANDROID_PATH_PREFIX) === 0)) {
            host = ANDROID_PATH_PREFIX;
          } else {
            TQ.Assert.isTrue((parser.pathname.indexOf(ANDROID_PATH_PREFIX) === 0),
              "android prefix是会自动加前缀到pathname中");
            TQ.Log.info(path);
          }
        }
      } else if (ionic.Platform.isIOS() || ionic.Platform.isIPad()) {
        TQ.Assert(false, 'ToDo: 处理IOS/IPad!');
      }
    }

    return protocol+"//" + host + parser.pathname;
  };

  Utility.urlConcat = function(path1, path2) {
    var middle = '/';
    if ( _isSeperator(path1[path1.length - 1])) {
      middle = '';
    }

    if (_isSeperator(path2[0])) {
      path2 = path2.substr(1);
    }
    return path1 + middle + path2;
  };

  // for cache: localStorage, local File, etc,
  // Don't directly use localStorage in other place
  Utility.readCache = function(item, defaultValue) {
    var result = localStorage.getItem(item);
    if (result == null || // Chrome, 没有找到
      (result == "") ||  // Firefox, 没有找到， 就返回"",
      (result == "null")) { // Chrome, 没有找到， 就返回"null",
      result = defaultValue;
    } else {
      if (typeof defaultValue != 'string') {
        result = JSON.parse(result);
      }
    }

    return result;    
  };

  Utility.removeCache = function(item) {
    localStorage.removeItem(item);
  };

  Utility.readCacheWithParse = function(item, defaultValue) {
    var result = localStorage.getItem(item);
    return (result ? JSON.parse(result): defaultValue);
  };

  Utility.writeCache = function(name, value) {
    if (typeof(value) !== 'string') {
      value = JSON.stringify(value);
    }
    return localStorage.setItem(name, value);
  };

  Utility.shadowCopy = function (obj) { // without reference
    return jQuery.extend({}, obj);
  };

  Utility.shadowCopyWithoutObject = function(source) {
    TQ.AssertExt.isTrue(arguments.length === 1, "直接返回值");
    var target = {};
    Utility.extendWithoutObject(target, source);
    return target;
  };

  Utility.extendWithoutObject = function (target, source) {
    for (var prop in source) {
      if (Utility.isObject(source[prop])) {
        continue;
      }
      target[prop] = source[prop];
    }
    return target;
  };

  Utility.extend = function (target, source) {
    return angular.extend(target, source);
  };

  Utility.isSoundBlob = function (item) {
    return ((item instanceof Blob) && !(item instanceof File) && (item.type) && (item.type.indexOf('audio') >= 0));
  };

  Utility.isSoundFile = function(aFile) {
    return ((aFile instanceof File) && (aFile.type) && (aFile.type.indexOf('audio') >= 0));
  };

  Utility.isVideoUrl = function (url) {
    var supportedFormat = ['.mp4'];
    return ((typeof url === 'string') &&
        (supportedFormat.indexOf(TQ.Utility.getExtension(url).toLowerCase()) >= 0));
  };

  Utility.isVideoFile = function (aFile) {
    return ((aFile instanceof File) && (aFile.type) && (aFile.type.indexOf('video') >= 0));
  };

  Utility.isBlob = function (data) {
    return (data instanceof Blob);
  };

  Utility.isLocalFile = function (data) {
    return (data instanceof File);
  };

  Utility.isBlobUrl = function (url) {
    return (typeof url === 'string') && (url.indexOf('blob:') === 0);
  };

  Utility.isLocalFileOrBlob = function (data) {
    return Utility.isLocalFile(data) || Utility.isBlob(data);
  };

  Utility.fileToUrl = function (file, options) {
    // convert blob, local file, to  url
    var url;
    if (!options) {
      options = {};
    }
    if (_isInstanceOf('Blob', file) ||
            _isInstanceOf('File', file)) {
      // Files are also Blob instances, but some browsers
      // (Firefox 3.6) support the File API but not Blobs:

      url = _createObjectURL(file);
      // Store the file type for resize processing:
      options._type = file.type;
    } else if (typeof file === 'string') {
      url = file;
      if (options && options.crossOrigin) {
        // img.crossOrigin = options.crossOrigin;
      }
    } else {
      TQ.Log.error("未知的文件信息");
      url = file;
    }

    return url;
  };

  // private
  function _isSeperator(ch) {
    return ((ch === '/') || ( ch === '\\'));
  }

  function _isInstanceOf(type, obj) {
    // Cross-frame instanceof check
    return Object.prototype.toString.call(obj) === '[object ' + type + ']';
  }

  function _createObjectURL(file) {
    return urlAPI ? urlAPI.createObjectURL(file) : false;
  }

  Utility.unifyFormat = function(type, src) {
    // 利用Cloudinary的自动格式转换功能， 迫使录音文件3gp转换为MP3
    // 从而， 可以播放
    if (src && (typeof src === 'string')) { // text和group等元素，没有src
      var pos = src.lastIndexOf('.'),
        root = src.substr(0, pos);
      switch (type) {
        case TQ.ElementType.SOUND:
          src = root + '.mp3';
          break;
        case TQ.ElementType.VIDEO:
          src = root + '.mp4';
          break;
        default:
          break;
      }
    }
    return src;
  };

  Utility.stringifyIgnoreCycle = function(obj) {
    var cache = [];
    return JSON.stringify(obj, function (key, value) {
      if (typeof value === 'object' && value !== null) {
        if (cache.indexOf(value) !== -1) {
          return;
        }
        cache.push(value);
      }
      return value;
    });
  };

  TQ.Base.Utility = Utility;
  TQUtility = Utility;
}());
