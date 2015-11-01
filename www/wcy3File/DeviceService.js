/**
 * Created by admin on 9/12/2015.
 */
angular.module('starter')
.factory('DeviceService', function(){
        var rootFolder;
        var _isReady = false;

        function getFullPath(file) {
            return (rootFolder + file);
        }

        function isReady() {
            return _isReady;
        }

        function initialize() {
            TQ.Log.debugInfo("device initialize... ");
            if (TQ.Base.Utility.isMobileDevice() && (typeof cordova !== "undefined")) {
                onFileSystemReady();
            } else { // for Chrome Desktop
                ImgCache.options.debug = true;
                ImgCache.options.usePersistentCache = true;
                ImgCache.init();
                document.addEventListener(ImgCache.FILE_SYSTEM_READY, onFileSystemReady, false);
            }
        }

        function onFileSystemReady() {
            TQ.Log.debugInfo("onFileSystemReady .....");
            if (TQ.Base.Utility.isMobileDevice()) {
                if (!TQ.Base.Utility.isCordovaDevice()) {// for Chrome simulator
                    rootFolder = ImgCache.getRoot();
                } else {
                    rootFolder = cordova.file.dataDirectory;
                }
            } else {
                rootFolder = ImgCache.getRoot();
            }
            TQ.Log.debugInfo("rootFolder = " + rootFolder);

            if (rootFolder !== '') {
                if ((rootFolder[rootFolder.length - 1] !== '/') && (rootFolder[rootFolder.length - 1] !== '\\')) {
                    rootFolder += "/";
                }
            }
            TQ.Config.CacheRootFolder = rootFolder;
            _isReady = true;
            TQ.Log.debugInfo("TQ.Config.CacheRootFolder = " + TQ.Config.CacheRootFolder);
            TQ.Base.Utility.triggerEvent(document, TQ.EVENT.FILE_SYSTEM_READY);
            TQ.Log.debugInfo("onFileSystemReady leave .....");
        }

        // private function:
        return {
            initialize: initialize,
            isReady: isReady,
            getRootFolder : function () {return rootFolder;},
            getFullPath: getFullPath
        }
    });
