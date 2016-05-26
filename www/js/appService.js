/**
 * Created by Andrewz on 5/8/2016.
 */
angular.module('starter').
    factory('AppService', ['$http', '$cookies', '$q', 'WxService', '$timeout', 'WCY', 'NetService', 'DeviceService',
        'Setup',
    function ($http, $cookies, $q, WxService, $timeout, WCY, NetService, DeviceService,
              Setup) {

        var _initialized = false,
            _onAppStarting = null,
            _onAppStarted = onAppStartDefault;

        function configCanvas() {
            if ((TQ.Config.workingRegionHeight === screen.height) &&
                (TQ.Config.workingRegionWidth = screen.width)) {  // no change
                return;
            }

            TQ.Config.workingRegionHeight = screen.height;
            TQ.Config.workingRegionWidth = screen.width;
            if (TQ.Config.workingRegionHeight > TQ.Config.workingRegionWidth) {
                TQ.Config.orientation = TQ.Config.ORIENTATION_PORTRAIT;
            } else {
                TQ.Config.orientation = TQ.Config.ORIENTATION_LANDSCAPE;
            }

            if (canvas) {
                canvas.height = TQ.Config.workingRegionHeight;
                canvas.width = TQ.Config.workingRegionWidth;
            }

            if (currScene) {
                currScene.isDirty = true;
            }

            TQ.Log.debugInfo("scren is: (" + TQ.Config.workingRegionWidth + ", " + TQ.Config.workingRegionHeight +")"
                + "orientation = " + TQ.Config.orientation);
        }

        function _init() {
            if (_initialized) {
                TQ.Log.error("Duplicated call in _init");
                return;
            }
            _initialized = true;
            TQ.Log.debugInfo("_init");
            WxService.init();
            window.addEventListener("resize", configCanvas);
            configCanvas();
            if (TQ.Config.LocalCacheEnabled) {
                document.addEventListener(TQ.EVENT.FILE_SYSTEM_READY, onFileSystemReady, false);
                DeviceService.initialize();
            } {
                onFileSystemReady();
            }

            if (_onAppStarting) {
                _onAppStarting();
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
            if (_onAppStarted) {
                $timeout(function () {
                    _onAppStarted();
                });
            }
        }

        function onAppStartDefault() {
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

        function setOnAppStarted(fn) {
            _onAppStarted = fn;
        }

        function setOnAppStarting(fn) {
            _onAppStarting = fn;
        }

        return {
            init: _init,
            onAppStarting: setOnAppStarting,
            onAppStarted: setOnAppStarted
        }
    }]);
