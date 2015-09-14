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
            rootFolder = cordova.file.dataDirectory;
            _isReady = true;
        }

        return {
            initialize: initialize,
            isReady: isReady,
            getRootFolder : function () {return rootFolder;},
            getFullPath: getFullPath
        }
    });
