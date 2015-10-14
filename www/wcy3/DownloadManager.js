/**
 * Created by admin on 9/26/2015.
 */
var TQ = TQ || {};

(function () {
    function DownloadManager() {
    }
    var p = DownloadManager;
    var urlConcat = TQ.Base.Utility.urlConcat;

    p.FAST_SERVER = "http://bone.udoido.cn";
    // p.FAST_SERVER = "http://www.udoido.com";
    // p.FAST_SERVER = "http://localhost:63342/eCard/www";
    // p.FAST_SERVER = "";
    p.DOWNLOAD_EVENT = "download-to-cache";
    var _tasks = 0;
    var _files = {};
    p.hasCached = function (name) {
        var item = _files[name];
        return (!!item  && !!item.cacheName);
    };

    p.download = function(name, cacheName, resourceID) {
        TQ.Assert.isTrue(false, "Depreciated");
    };

    p.downloadAux = function(resourceID, cacheName, onSuccess, onError) {
        TQ.Assert.isFalse(p.hasCached(resourceID), "已经cached！！");
        var onLsError = makeLsOnError();
        // server Ls
        var fullPathLs = TQ.RM.toFullPathLs(resourceID);
        _download(fullPathLs, cacheName, resourceID, onSuccess, onLsError);

        // server Fs
        function makeLsOnError() {
            return function() {
                var fullPathFs = _toFullPathFs(resourceID);
                TQ.Assert.isFalse(TQ.DownloadManager.hasCached(resourceID),
                    "已经cache了！");
                _download(fullPathFs, cacheName, resourceID, onSuccess, onError);
            }
        }
    };

    p.onCompleted = function(data) {
        var cacheName = data.target;
        var resourceID = data.key;
        var item = _files[resourceID];
        item.cacheName = cacheName;
        var onSuccess = item.onSuccess;
        item.onSuccess = null;
        item.onError = null;
        p.save();
        if (onSuccess) {
            var callback = onSuccess.shift();
            while (callback) {
                callback();
                _tasks--;
                callback = onSuccess.shift();
            }
        }
    };

    p.onError = function(error, data) {
        var name = data.source;
        var resourceID = data.key;
        var item = _files[resourceID];
        _files[resourceID] = null; //  remove old one;
        if (!error.handled) {
            if (typeof error.http_status !== 'undefined') {
                if (error.http_status == 404) {
                    TQ.Log.error('找不到文件：' + name);
                } else {
                    TQ.Log.error('下载文件出错: target目录缺失？ 或者无空间：' + name);
                }
            } else {
                TQ.Log.error('下载文件出错: ' + name);
            }
        }
        item.cacheName = null;  // no cache file
        var onError = item.onError;
        item.onSuccess = null;
        item.onError = null;
        if (onError) {
            var callback = onError.shift();
            while (callback) {
                callback();
                _tasks--;
                callback = onError.shift();
            }
        }
    };

    p.hasCompleted = function() {
        return (_tasks===0);
    };

    p.clearCache = function() {
        _files = {};
        p.save();

        //ToDo: remove file from cache
    };

    p.save = function() {
        localStorage.setItem('fileList', JSON.stringify(_files));
    };

    p.downloadBulk = function(bulk) {
        for (var i = 0; i < bulk.length; i++) {
            if (typeof bulk[i] === 'array') {
                p.downloadBulk(bulk[i]);
                continue;
            }

            if (!bulk[i] || !bulk[i].path) {
                continue;
            }

            var resourceID = bulk[i].path;
            if (p.hasCached(resourceID)) {
                continue;
            }

            var cacheName = TQ.RM.toCachePath(resourceID);
            p.downloadAux(resourceID, cacheName);
        }
    };

    p.initialize = function() {
        var str = localStorage.getItem('fileList');
        if (!!str) {
            _files = JSON.parse(str);
        }
    };

    // private
    function _toFullPathFs(name) { //File Server, such as udoido.com
        name = TQ.RM.toRelative(name);
        return urlConcat(p.FAST_SERVER, name);
    }

    function _download(name, cacheName, resourceID, onSuccess, onError) {
        var item = _files[resourceID];
        if (!item) {
            _files[resourceID] = {onSuccess: [onSuccess], onError: [onError], cacheName: null};
        } else {
            item.onSuccess.push(onSuccess);
            item.onError.push(onError);
        }

        _tasks++;
        TQ.Base.Utility.triggerEvent(document, p.DOWNLOAD_EVENT, {key: resourceID, source: name, target: cacheName});
    }

    TQ.DownloadManager = DownloadManager;
}());
