/**
 * Created by admin on 9/26/2015.
 * DownloadManager： 下载素材到本地（app的本地文件，或PC的仿真cache），接口：
 *  * initialize
 *  * clearCache
 *
 *  * downloadBulk
 *  * downloadAux
 *  * onCompleted
 *  * onError
 *
 *  * hasCompleted
 *  * hasCached
 */
var TQ = TQ || {};

(function () {
    function DownloadManager() {
    }
    var p = DownloadManager;
    var urlConcat = TQ.Base.Utility.urlConcat;

    p.FAST_SERVER = TQ.Config.MAT_HOST;
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

    p.getCached = function (name) {
        var item = _files[name];
        TQ.Assert.isTrue(!!item, "必须存在");
        return (item.cacheName);
    };

    p.download = function(name, cacheName, resourceID) {
        TQ.Assert.isTrue(false, "Depreciated");
    };

    p.downloadAux = function(resourceID, cacheName, onSuccess, onError) {
        TQ.Assert.isFalse(p.hasCached(resourceID), "已经cached！！");
        var onLsError;

        if (TQ.Config.TwoMatServerEnabled) {
            onLsError = makeLsOnError();
        } else {
            onLsError = onError;
        }

        // full path in File Server
        var fullPathFs = TQ.RM.toFullPathFs(resourceID);
        _download(fullPathFs, cacheName, resourceID, onSuccess, onLsError);

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
        if (!item) {
            TQ.Log.error("找不到callback： for" + resourceID);
            return;
        }

        item.cacheName = cacheName;
        var onSuccess = item.onSuccess;
        item.onSuccess = [];
        item.onError = [];
        p.save();
        var callback;
        if (onSuccess) {
            while (onSuccess.length >0) {
                callback = onSuccess.shift();
                if (callback) {
                    callback();
                }
            }
        }
        _tasks--;
    };

    p.onError = function(error, data) {
        var name = data.source;
        var resourceID = data.key;
        var item = _files[resourceID];
        if (!item) {
            TQ.Log.error("找不到callback： for" + resourceID);
            return;
        }

        _files[resourceID] = null; //  remove old one;
        p.save();
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
        item.onSuccess = [];
        item.onError = [];
        var callback;
        if (onError) {
            while (onError.length > 0) {
                callback = onError.shift();
                if (callback) {
                    callback();
                }
            }
        }
        _tasks--;
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
            if (Array.isArray(bulk[i])) {
                p.downloadBulk(bulk[i]);
                continue;
            }

            if (!bulk[i] || !bulk[i].path) {
                continue;
            }

            var resourceID = bulk[i].path;
            var cacheName = TQ.RM.toCachePath(resourceID);

            var use_cache_file = true;
            if (use_cache_file) {
                bulk[i].path = cacheName;
            }

            if (p.hasCached(resourceID)) {
                continue;
            }
            p.downloadAux(resourceID, cacheName);
        }
    };

    p.initialize = function() {
        var str = localStorage.getItem('fileList');
        if (!!str) {
            _files = JSON.parse(str);
            if (_files) {
                for (var i = 0; i <_files.length; i++) {
                    var item = _files[i];
                    if (item.onSuccess) {
                        item.onSuccess.splice(0);
                    }

                    if (item.onError) {
                        item.onError.splice(0);
                    }
                }
            }
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
            return;
        }

        _tasks++;
        TQ.Base.Utility.triggerEvent(document, p.DOWNLOAD_EVENT, {key: resourceID, source: name, target: cacheName});
    }

    TQ.DownloadManager = DownloadManager;
}());
