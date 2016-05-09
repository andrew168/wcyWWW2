/**
 * Created by Andrewz on 5/8/2016.
 */
angular.module('starter').
    factory('AppService', ['$http', '$cookies', '$q', 'WxService', '$timeout', 'WCY', 'NetService', 'DeviceService',
        'Setup',
    function ($http, $cookies, $q, WxService, $timeout, WCY, NetService, DeviceService,
              Setup) {
        function _init() {
            WxService.init();
            if (TQ.Config.LocalCacheEnabled) {
                document.addEventListener(TQ.EVENT.FILE_SYSTEM_READY, onFileSystemReady, false);
                DeviceService.initialize();
            } {
                onFileSystemReady();
            }
        }

        // 三个阶段： DeveiceReady, DOM ready, ImageCacheReady, DirReady
        function onFileSystemReady() {
            if (TQ.Config.LocalCacheEnabled) {
                document.addEventListener(TQ.EVENT.DIR_READY, onDirReady, false);
                document.removeEventListener(TQ.EVENT.FILE_SYSTEM_READY, onFileSystemReady);
                Setup.initialize();
                NetService.initialize();
            } else {
                NetService.initialize();
                onDirReady();
            }
        }

        function onDirReady() {
            if (TQ.Config.LocalCacheEnabled) {
                document.removeEventListener(TQ.EVENT.DIR_READY, onDirReady);
                assertTrue("device要先ready", DeviceService.isReady());
            }
            $timeout(function () {
                appStart();
            }, 100);
        }

        function appStart() {
            // $scope.testDownload();

            var opus = TQ.Utility.getUrlParam('opus');
            // opus = "100_12345678_123_1234567890";
            // opus = "100_00000016_123_1234567890";
            // opus = "100_00000025_123_1234567890";
            if (opus) {
                WCY.getWcy(opus);
            } else {
                WCY.start();
            }
            //WxService.init();
//                    $scope.insertLocalImage();
            // $cordovaProgress.hide();
        }

        return {
            init: _init
        }
    }]);
