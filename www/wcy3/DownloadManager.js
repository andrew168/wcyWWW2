/**
 * Created by admin on 9/26/2015.
 */
this.TQ = this.TQ || {};

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

    p.download = function(name, cacheName, callback) {
        TQ.Assert.isFalse(p.hasCached(cacheName), "已经cached！！");
        var item = _files[name];
        if (!item) {
            item = _files[name] = {callback: [callback], cacheName:null};
        } else {
            item.callback.push(callback);
        }

        _tasks ++;
        TQ.Base.Utility.triggerEvent(document, p.DOWNLOAD_EVENT, {name: name, cacheName:cacheName});
    };

    p.onCompleted = function(name, cacheName) {
        var item = _files[name];
        item.cacheName = cacheName;
        var callbacks = item.callback;
        if (callbacks) {
            for (var i = 0; i < callbacks.length; i++) {
                if (callbacks[i]) {
                    callbacks[i]();
                    _tasks--;
                }
            }
        }
    };

    p.onError = function(error, name, cacheName) {
        var item = _files[name];
        item.cacheName = cacheName;
        var callbacks = item.callback;
        if (callbacks) {
            for (var i = 0; i < callbacks.length; i++) {
                if (callbacks[i]) {
                    callbacks[i]();
                }
            }
        }
    };

    p.hasCompleted = function() {
        return (_tasks===0);
    };

    TQ.DownloadManager = DownloadManager;
}());
