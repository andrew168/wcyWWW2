/*jslint browser:true*/
/*global console,LocalFileSystem,device,FileTransfer,define,module*/
/*
 * ChromeFile: 在PC上用Chrome文件系统模拟app的本地文件， 实现离线的编辑和存储
 */

var ImgCache = {
        version: '1.0rc1',
        // options to override before using the library (but after loading this script!)
        options: {
            debug: false,                           /* call the log method ? */
            localCacheFolder: 'imgcache',           /* name of the cache folder */
            chromeQuota: 10 * 1024 * 1024,          /* allocated cache space : here 10MB */
            usePersistentCache: true,               /* false = use temporary cache storage */
            cacheClearSize: 0,                      /* size in MB that triggers cache clear on init, 0 to disable */
            headers: {},                            /* HTTP headers for the download requests -- e.g: headers: { 'Accept': 'application/jpg' } */
            skipURIencoding: false                  /* enable if URIs are already encoded (skips call to sanitizeURI) */
        },
        overridables: {
            log: function (str, level) {
                    'use strict';
                    if (ImgCache.options.debug) {
                        if (level === LOG_LEVEL_INFO) { str = 'INFO: ' + str; }
                        if (level === LOG_LEVEL_WARNING) { str = 'WARN: ' + str; }
                        if (level === LOG_LEVEL_ERROR) { str = 'ERROR: ' + str; }
                        console.log(str);
                    }
            }
        },
        ready: false,
        attributes: {}
    },
    LOG_LEVEL_INFO = 1,
    LOG_LEVEL_WARNING = 2,
    LOG_LEVEL_ERROR = 3;

(function ($) {

    'use strict';

    /** Helpers *****************************************************************/
    var Helpers = {};

    // make sure the url does not contain funny characters like spaces that might make the download fail
    Helpers.sanitizeURI = function (uri) {
        if (ImgCache.options.skipURIencoding) {
            return uri;
        } else {
            var encodedURI = encodeURI(uri);
            return encodedURI;
        }
    };

    // with a little help from http://code.google.com/p/js-uri/
    Helpers.URI = function (str) {
        if (!str) { str = ''; }
        // Based on the regex in RFC2396 Appendix B.
        var parser = /^(?:([^:\/?\#]+):)?(?:\/\/([^\/?\#]*))?([^?\#]*)(?:\?([^\#]*))?(?:\#(.*))?/,
            result = str.match(parser);
        this.scheme    = result[1] || null;
        this.authority = result[2] || null;
        this.path      = result[3] || null;
        this.query     = result[4] || null;
        this.fragment  = result[5] || null;
    };
    // returns lower cased filename from full URI
    Helpers.URIGetFileName = function (fullpath) {
        if (!fullpath) {
            return;
        }
        //TODO: there must be a better way here.. (url encoded strings fail)
        var idx = fullpath.lastIndexOf('/');
        if (!idx) {
            return;
        }
        return fullpath.substr(idx + 1).toLowerCase();
    };

    // returns lower cased path from full URI
    Helpers.URIGetPath = function (str) {
        if (!str) {
            return;
        }
        var uri = Helpers.URI(str);
        return uri.path.toLowerCase();
    };

    // Returns a URL that can be used to locate a file
    Helpers.EntryGetURL = function (entry) {
        // toURL for html5, toURI for cordova 1.x
        return (typeof entry.toURL === 'function' ? entry.toURL() : entry.toURI());
    };

    // Returns the full absolute path from the root to the FileEntry
    Helpers.EntryGetPath = function (entry) {
         return entry.fullPath;
    };

    /** Private *****************************************************************/
    var Private = { attributes: {} };

    Private.isImgCacheLoaded = function () {
        if (!ImgCache.attributes.filesystem || !ImgCache.attributes.dirEntry) {
            ImgCache.overridables.log('ImgCache not loaded yet! - Have you called ImgCache.init() first?', LOG_LEVEL_WARNING);
            return false;
        }
        return true;
    };

    Private.attributes.hasLocalStorage = false;
    Private.hasLocalStorage = function () {
        // if already tested, avoid doing the check again
        if (Private.attributes.hasLocalStorage) {
            return Private.attributes.hasLocalStorage;
        }
        try {
            var mod = TQ.Base.Utility.urlParser('imgcache_test').pathname;
            localStorage.setItem(mod, mod);
            localStorage.removeItem(mod);
            Private.attributes.hasLocalStorage = true;
            return true;

        } catch (e) {
            // this is an info, not an error
            ImgCache.overridables.log('Could not write to local storage: ' + e.message, LOG_LEVEL_INFO);
            return false;
        }
    };

    Private.setCurrentSize = function (curSize) {
        ImgCache.overridables.log('current size: ' + curSize, LOG_LEVEL_INFO);
        if (Private.hasLocalStorage()){
            localStorage.setItem('imgcache:' + ImgCache.options.localCacheFolder, curSize);
        }
    };

    Private.getCachedFilePath = function (img_src) {
        return ImgCache.options.localCacheFolder + '/' + Private.getCachedFileName(img_src);
    };

    // used for FileTransfer.download only
    Private.getCachedFileFullPath = function (img_src) {
        var local_root = Helpers.EntryGetPath(ImgCache.attributes.dirEntry);
        return (local_root ? local_root : '') + Private.getCachedFileName(img_src);
    };

    Private.getCachedFileName = function (img_src) {
        if (!img_src) {
            ImgCache.overridables.log('No source given to getCachedFileName', LOG_LEVEL_WARNING);
            return;
        }
        var nameInCache = TQ.Base.Utility.urlParser(img_src).pathname;
        return nameInCache;
    };

    Private.setNewImgPath = function (){};

    Private.createCacheDir = function (success_callback, error_callback) {
        var _fail = function (error) {
            ImgCache.overridables.log('Failed to get/create local cache directory: ' + error.code, LOG_LEVEL_ERROR);
            if (error_callback) { error_callback(error); }
        };
        var _getDirSuccess = function (dirEntry) {
            ImgCache.attributes.dirEntry = dirEntry;
            ImgCache.overridables.log('Local cache folder opened: ' + Helpers.EntryGetPath(dirEntry), LOG_LEVEL_INFO);
            if (success_callback) { success_callback(); }

            ImgCache.ready = true;
            TQ.Base.Utility.triggerEvent(document, ImgCache.FILE_SYSTEM_READY);
        };
        ImgCache.attributes.filesystem.root.getDirectory(ImgCache.options.localCacheFolder, {create: true, exclusive: false}, _getDirSuccess, _fail);
    };

    // This is a wrapper for phonegap's FileTransfer object in order to implement the same feature
    // in Chrome (and possibly extra browsers in the future)
    Private.FileTransferWrapper = function (filesystem) {
        this.filesystem = filesystem;    // only useful for CHROME
    };

    Private.WriteFile = function(localPath, data, success_callback, error_callback) {
        var filesystem = ImgCache.attributes.filesystem;

        // assertTrue("需要本地的path， 不带host", TQ.Base.Utility.urlParser(localPath).host ==='');
        filesystem.root.getFile(localPath, { create:true }, function (fileEntry) {
            fileEntry.createWriter(function (writer) {
                writer.onerror = error_callback;
                writer.onwriteend = function () {
                    if (!!success_callback) {
                        success_callback(fileEntry);
                    }
                };
                writer.write(data, error_callback);
            }, error_callback);
        }, error_callback);
    };

    Private.FileTransferWrapper.prototype.download = function (uri, localPath, success_callback, error_callback, on_progress) {
        var headers = ImgCache.options.headers || {};
        var isOnProgressAvailable = (typeof on_progress === 'function');

        if (this.fileTransfer) {
            if (isOnProgressAvailable) {
                this.fileTransfer.onprogress = on_progress;
            }
            return this.fileTransfer.download(uri, localPath, success_callback, error_callback, false, { 'headers': headers });
        }

        // CHROME - browsers
        var _fail = function (error, error_callback) {
            // mock up FileTransferError, so at least caller knows there was a problem.
            // Normally, the error.code in the callback is a FileWriter error, we return 0 if the error was an XHR error
            if (error_callback) {
                error.code = 0;
                error.source = uri;
                error.target = localPath;
                error_callback(error);
            } else {
                ImgCache.overridables.log(error, level);
            }
        };
        var xhr = new XMLHttpRequest();
        xhr.open('GET', uri, true);
        if (isOnProgressAvailable) {
            xhr.onprogress = on_progress;
        }
        xhr.responseType = 'blob';
        for (var key in headers) {
            xhr.setRequestHeader(key, headers[key]);
        }
        xhr.onload = function () {
            if (xhr.response && (xhr.status === 200 || xhr.status === 0)) {
                Private.WriteFile(localPath, xhr.response, success_callback, error_callback);
            } else {
                _fail({msg: 'Image could not be downloaded', http_status:xhr.status},
                    error_callback);
            }
        };
        xhr.onerror = function () {
            _fail({msg: 'XHR error, could not be downloaded', http_status:xhr.status},
                error_callback);
        };
        xhr.send();
    };

    /****************************************************************************/
    ImgCache.FILE_SYSTEM_READY = 'imgCache ready';

    ImgCache.init = function (success_callback, error_callback) {
        ImgCache.jQuery = (window.jQuery || window.Zepto) ? true : false;        /* using jQuery if it's available otherwise the DOM API */

        ImgCache.attributes.init_callback = success_callback;

        ImgCache.overridables.log('ImgCache initialising', LOG_LEVEL_INFO);

        var _checkSize = function (callback) {
            if (ImgCache.options.cacheClearSize > 0) {
                var curSize = ImgCache.getCurrentSize();
                if (curSize > (ImgCache.options.cacheClearSize * 1024 * 1024)) {
                    ImgCache.clearCache(callback, callback);
                } else {
                    if (callback) { callback(); }
                }
            } else {
                if (callback) { callback(); }
            }
        };
        var _gotFS = function (filesystem) {
            // store filesystem handle
            ImgCache.attributes.filesystem = filesystem;

            Private.createCacheDir(function () {
                _checkSize(ImgCache.attributes.init_callback);
            }, error_callback);
        };
        var _fail = function (error) {
            ImgCache.overridables.log('Failed to initialise LocalFileSystem ' + error.code, LOG_LEVEL_ERROR);
            if (error_callback) { error_callback(error); }
        };

            //CHROME
            window.requestFileSystem  = window.requestFileSystem || window.webkitRequestFileSystem;
            window.storageInfo = window.storageInfo || (ImgCache.options.usePersistentCache ? navigator.webkitPersistentStorage : navigator.webkitTemporaryStorage);
            if (!window.storageInfo) {
                ImgCache.overridables.log('Your browser does not support the html5 File API', LOG_LEVEL_WARNING);
                if (error_callback) { error_callback(); }
                return;
            }
            // request space for storage
            var quota_size = ImgCache.options.chromeQuota;
            window.storageInfo.requestQuota(
                quota_size,
                function () {
                    /* success*/
                    var persistence = (ImgCache.options.usePersistentCache ? window.storageInfo.PERSISTENT : window.storageInfo.TEMPORARY);
                    window.requestFileSystem(persistence, quota_size, _gotFS, _fail);
                },
                function (error) {
                    /* error*/
                    ImgCache.overridables.log('Failed to request quota: ' + error.message, LOG_LEVEL_ERROR);
                    if (error_callback) { error_callback(error); }
                }
            );

    };

    ImgCache.getCurrentSize = function () {
        if (Private.hasLocalStorage()) {
            var curSize = localStorage.getItem('imgcache:' + ImgCache.options.localCacheFolder);
            if (curSize === null) {
                return 0;
            }
            return parseInt(curSize, 10);
        } else {
            return 0;
        }
    };

    // this function will not check if the image is already cached or not => it will overwrite existing data
    // on_progress callback follows this spec: http://www.w3.org/TR/2014/REC-progress-events-20140211/ -- see #54
    ImgCache.cacheFile = function (img_src, img_cache, success_callback, error_callback, on_progress) {

        if (!Private.isImgCacheLoaded() || !img_src) {
            return;
        }

        img_src = Helpers.sanitizeURI(img_src);

        var filePath = _toCacheRelative(img_cache); // Private.getCachedFileFullPath(img_src);

        var fileTransfer = new Private.FileTransferWrapper(ImgCache.attributes.filesystem);
        fileTransfer.download(
            img_src,
            filePath,
            function (entry) {
                entry.getMetadata(function (metadata) {
                    if (metadata && metadata.hasOwnProperty('size')) {
                        ImgCache.overridables.log('Cached file size: ' + metadata.size, LOG_LEVEL_INFO);
                        Private.setCurrentSize(ImgCache.getCurrentSize() + parseInt(metadata.size, 10));
                    } else {
                        ImgCache.overridables.log('No metadata size property available', LOG_LEVEL_INFO);
                    }
                });
                ImgCache.overridables.log('Download complete: ' + Helpers.EntryGetPath(entry), LOG_LEVEL_INFO);

                // iOS: the file should not be backed up in iCloud
                // new from cordova 1.8 only
                if (entry.setMetadata) {
                    entry.setMetadata(
                        function () {
                        /* success*/
                            ImgCache.overridables.log('com.apple.MobileBackup metadata set', LOG_LEVEL_INFO);
                        },
                        function () {
                        /* failure */
                            ImgCache.overridables.log('com.apple.MobileBackup metadata could not be set', LOG_LEVEL_WARNING);
                        },
                        { 'com.apple.MobileBackup': 1 }
                        // 1=NO backup oddly enough..
                    );
                }

                if (success_callback) { success_callback(); }
            },
            function (error) {
                if ((!error.http_status) || (error.http_status !== 404)) {
                    var msg = "下载文件出错";
                    if (error.source) {
                        msg += "，找不到文件：" + error.source;
                    }

                    if (!error.target) {
                        msg += "，Cache中没有相应的目录！" + filePath;
                    }

                    msg += '， error code = ' + error.code;
                    TQ.Log.error(msg);
                } // else 由http系统报错
                error.handled = true;
                if (error_callback) { error_callback(error); }
            },
            on_progress
        );
    };

    // Returns the file already available in the cached
    // Reminder: this is an asynchronous method!
    // Answer to the question comes in response_callback as the second argument (first being the path)
    ImgCache.getCachedFile = function (img_src, response_callback) {
        // sanity check
        if (!Private.isImgCacheLoaded() || !response_callback) {
            return;
        }

        img_src = Helpers.sanitizeURI(img_src);

        var path = Private.getCachedFilePath(img_src);

        // try to get the file entry: if it fails, there's no such file in the cache
        ImgCache.attributes.filesystem.root.getFile(
            path,
            { create: false },
            function (file_entry) { response_callback(img_src, file_entry); },
            function () { response_callback(img_src, null); }
        );
    };

    // Returns the local url of a file already available in the cache
    ImgCache.getCachedFileURL = function (img_src, success_callback, error_callback) {
        var _getURL = function (img_src, entry) {
            if (!entry) {
                if (error_callback) { error_callback(img_src); }
            } else {
                success_callback(img_src, Helpers.EntryGetURL(entry));
            }
        };

        ImgCache.getCachedFile(img_src, _getURL);
    };


    // checks if a copy of the file has already been cached
    // Reminder: this is an asynchronous method!
    // Answer to the question comes in response_callback as the second argument (first being the path)
    ImgCache.isCached = function (img_src, response_callback) {
        ImgCache.getCachedFile(img_src, function (src, file_entry) {
            response_callback(src, file_entry !== null);
        });
    };

    // clears the cache
    ImgCache.clearCache = function (success_callback, error_callback) {

        if (!Private.isImgCacheLoaded()) {
            return;
        }

        // delete cache dir completely
        ImgCache.attributes.dirEntry.removeRecursively(
            function () {
                ImgCache.overridables.log('Local cache cleared', LOG_LEVEL_INFO);
                Private.setCurrentSize(0);
                // recreate the cache dir now
                Private.createCacheDir(success_callback, error_callback);
            },
            function (error) {
                ImgCache.overridables.log('Failed to remove directory or its contents: ' + error.code, LOG_LEVEL_ERROR);
                if (error_callback) { error_callback(error); }
            }
        );
    };

    ImgCache.removeFile = function (img_src, success_callback, error_callback) {

        img_src = Helpers.sanitizeURI(img_src);

        var filePath = Private.getCachedFilePath(img_src);
        var _fail = function (error) {
            ImgCache.overridables.log('Failed to remove file due to ' + error.code, LOG_LEVEL_ERROR);
            if (error_callback) { error_callback(error); }
        };
        ImgCache.attributes.filesystem.root.getFile(filePath, { create: false }, function (fileEntry) {
            fileEntry.remove(
                function () {
                    if (success_callback) { success_callback(); }
                },
                _fail
            );
        }, _fail);
    };

    // returns the URI of the local cache folder (filesystem:)
    // this function is more useful for the examples than for anything else..
    // Synchronous method
    ImgCache.getCacheFolderURI = function () {

        if (!Private.isImgCacheLoaded()) {
            return;
        }

        return Helpers.EntryGetURL(ImgCache.attributes.dirEntry);
    };

    ImgCache.WriteFile = function(filename, target, data, success_callback, error_callback) {
        //var localPath = Private.getCachedFileFullPath(filename);
        var localPath = _toCacheRelative(target);
        Private.WriteFile(localPath, data, success_callback, error_callback);
    };

    ImgCache.createDir = function (dirName, onSuccess, onError) {
        var _fail = function (error) {
            ImgCache.overridables.log('Failed to get/create local cache directory: ' + error.code, LOG_LEVEL_ERROR);
            if (!!onError) onError(error);
        };
        var _getDirSuccess = function (dirEntry) {
            ImgCache.overridables.log('Local cache folder opened: ' + Helpers.EntryGetPath(dirEntry), LOG_LEVEL_INFO);
            if (!!onSuccess) onSuccess(dirEntry);
        };

        var pathname = ImgCache.options.localCacheFolder + "/" + dirName;
        ImgCache.attributes.filesystem.root.getDirectory(pathname, {create: true, exclusive: false}, _getDirSuccess, _fail);
    };

    ImgCache.getRoot =function() {
        return Helpers.EntryGetURL(ImgCache.attributes.dirEntry);
    };

    // private methods can now be used publicly
    ImgCache.helpers = Helpers;
    ImgCache.private = Private;

    /****************************************************************************/


    // Expose the class either via AMD, CommonJS or the global object
    if (typeof define === 'function' && define.amd) {
        define('imgcache', [], function () {
            return ImgCache;
        });
    }
    else if (typeof module === 'object' && module.exports){
        module.exports = ImgCache;
    }
    else {
        window.ImgCache = ImgCache;
    }

    function _toCacheRelative(path) {
        var start = path.lastIndexOf(ImgCache.options.localCacheFolder);
        TQ.Assert.isTrue(start > 0, "target路径错误");
        return path.substr(start-1);
    }

})(window.jQuery || window.Zepto || function () { throw "jQuery is not available"; } );
