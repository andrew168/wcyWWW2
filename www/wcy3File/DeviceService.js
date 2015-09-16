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
            if (ionic.Platform.isAndroid() ||
                ionic.Platform.isIOS() ||
                ionic.Platform.isWebView() ||
                ionic.Platform.isWindowsPhone()) {
                rootFolder = cordova.file.dataDirectory;
            } else {
                rootFolder = "";
            }

            _isReady = true;
        }

        return {
            initialize: initialize,
            isReady: isReady,
            getRootFolder : function () {return rootFolder;},
            getFullPath: getFullPath
        }
    });
