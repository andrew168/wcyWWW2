/**
 * Created by admin on 9/12/2015.
 */
angular.module('starter')
.factory('DeviceService', function(){

        var rootFolder;

        function getFullPath(file) {
            return (rootFolder + file);
        }


        ionic.Platform.ready(function () {
            rootFolder = cordova.file.dataDirectory;
        });

        return {
            getRootFolder : function () {return rootFolder;},
            getFullPath: getFullPath
        }
    });
