/**
 * Created by admin on 9/26/2015.
 */
var TQ = TQ || {};

(function () {
    function DownloadManager() {
    }
    var p = DownloadManager;
    p.DOWNLOAD_EVENT = "download-to-cache";
    var _tasks = 0;
    var _files = {};
    p.hasCached = function (name) {
        var item = _files[name];
        return (!!item  && !!item.cacheName);
    };

    p.download = function(name, cacheName, onSuccess, onError) {
        TQ.Assert.isFalse(p.hasCached(name), "已经cached！！");
        var item = _files[name];
        if (!item) {
            _files[name] = {onSuccess: [onSuccess], onError:[onError], cacheName:null};
        } else {
            item.onSuccess.push(onSuccess);
            item.onError.push(onError);
        }

        _tasks ++;
        TQ.Base.Utility.triggerEvent(document, p.DOWNLOAD_EVENT, {source: name, target:cacheName});
    };

    p.onCompleted = function(name, cacheName) {
        var item = _files[name];
        item.cacheName = cacheName;
        var onSuccess = item.onSuccess;
        p.save();
        if (onSuccess) {
            for (var i = 0; i < onSuccess.length; i++) {
                if (onSuccess[i]) {
                    onSuccess[i]();
                    _tasks--;
                }
            }
        }
    };

    p.onError = function(error, name, cacheName) {
        var item = _files[name];
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
        if (onError) {
            for (var i = 0; i < onError.length; i++) {
                if (onError[i]) {
                    onError[i]();
                    _tasks--;
                }
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

    p.initialize = function() {
        var str = localStorage.getItem('fileList');
        if (!!str) {
            _files = JSON.parse(str);
        }
    };

    TQ.DownloadManager = DownloadManager;
}());
