/**
 * Created by admin on 9/18/2015.
 */
var TQ = TQ || {};
TQ.Base = TQ.Base || {};
var TQUtility; //

(function() {
    function Utility() {
    }

    Utility.isIOS = isIOS;
    Utility.isAndroid = isAndroid;

    Utility.isObject = function(obj) {
        return (typeof obj === 'object');
    };

    Utility.isPC = function () { // including windows and mac
        TQ.Log.depreciated('Utility.isPC');
        return (!window.device && !window.cordova);
    };

    function isAndroid() {
        if (!window.device) {
            return false;
        }
        return (window.device.platform.toLowerCase() === 'android');
    }

    function isIOS() { // only mobile, pad, no mac
        if (!window.device) {
            return false;
        }
        return (window.device.platform.toLowerCase() === 'ios')
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
        if (isPC()) {
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
        return (result ? result : defaultValue);
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

    Utility.shadowCopyWithoutObject = function(target, source) {
        for (var prop in source) {
            if (!source.hasOwnProperty(prop) || Utility.isObject(source[prop])) {
                continue;
            }
            target[prop] = source[prop];
        }
    };

    // private
    function _isSeperator(ch) {
        return ((ch === '/') || ( ch === '\\'));
    }

    TQ.Base.Utility = Utility;
    TQUtility = Utility;
}());
