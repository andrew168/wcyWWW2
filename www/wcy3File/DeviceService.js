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
            if (TQ.Base.Utility.isMobileDevice()) {
                onFileSystemReady();
            } else { // for Chrome Desktop
                ImgCache.options.debug = true;
                ImgCache.options.usePersistentCache = true;
                ImgCache.init();
                document.addEventListener(ImgCache.FILE_SYSTEM_READY, onFileSystemReady, false);
            }
        }

        function onFileSystemReady() {
            if (TQ.Base.Utility.isMobileDevice()) {
                if ((typeof cordova == "undefined") || (typeof cordova.file === "undefined")) {// for Chrome simulator
                    rootFolder = "";
                } else {
                    rootFolder = cordova.file.dataDirectory;
                }
            } else {
                rootFolder = ImgCache.getRoot();
            }
            _isReady = true;
            TQ.Base.Utility.triggerEvent(document, TQ.EVENT.FILE_SYSTEM_READY);
        }

        return {
            initialize: initialize,
            isReady: isReady,
            getRootFolder : function () {return rootFolder;},
            getFullPath: getFullPath
        }
    });
