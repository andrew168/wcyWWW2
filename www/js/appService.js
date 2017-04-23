/**
 * Created by Andrewz on 5/8/2016.
 */
angular.module('starter').factory('AppService', AppService);

AppService.$inject = ['$stateParams', '$timeout', 'WCY', 'NetService', 'DeviceService',
        'Setup', 'UserService'];

function AppService($stateParams, $timeout, WCY, NetService, DeviceService,
              Setup, UserService) {

        var _initialized = false,
            _onAppStarting = null,
            _onAppStarted = onAppStartDefault;

        function configCanvas() {
            updateDeviceInfo();
            determineWorkingRegion();
            TQ.Graphics.setCanvas();
            if (currScene) {
                TQ.DirtyFlag.setScene();
            }

            TQ.Log.debugInfo("scren is: (" + TQ.Config.workingRegionWidth + ", " + TQ.Config.workingRegionHeight +")"
                + "orientation = " + TQ.Config.orientation);
        }

    function updateDeviceInfo() {
        if ((TQ.State.viewportWidth === window.innerWidth) &&
            (TQ.State.viewportHeight === window.innerHeight)) {  // no change
            return false;
        }

        TQ.State.viewportWidth = window.innerWidth;
        TQ.State.viewportHeight = window.innerHeight;
        return true;
    }

    function determineWorkingRegion() {
        var h = TQ.State.viewportHeight,
            w = TQ.State.viewportWidth,
            designated = !currScene ? TQ.Scene.getDesignatedRegionDefault(): currScene.getDesignatedRegion();

        scaleMin = Math.min(w / designated.w, h / designated.h);
        TQ.Config.workingRegionWidth = scaleMin * designated.w;
        TQ.Config.workingRegionHeight = scaleMin * designated.h;
        if (TQ.Config.workingRegionHeight > TQ.Config.workingRegionWidth) {
            TQ.Config.orientation = TQ.Config.ORIENTATION_PORTRAIT;
        } else {
            TQ.Config.orientation = TQ.Config.ORIENTATION_LANDSCAPE;
        }

        TQ.Config.workingRegionX0 = Math.round((TQ.State.viewportWidth - TQ.Config.workingRegionWidth) / 2);
        TQ.Config.workingRegionY0 = Math.round((TQ.State.viewportHeight - TQ.Config.workingRegionHeight) / 2);
    }

    function _init() {
            UserService.tryAutoLogin();
            if (_initialized) {
                TQ.Log.error("Duplicated call in _init");
                return;
            }
            if (!TQ.Utility.isSupportedEnvironment()) {
                TQ.MessageBox.prompt('请下载安装<a href="https://www.google.ca/chrome/browser/features.html" style="font-weight: bold; text-decoration: underline">谷歌浏览器</a>！');
                return;
            }
            _initialized = true;
            TQ.Log.debugInfo("_init");
            jscolor.installByClassName('jscolor');
            configCanvas();
            if (TQ.Config.LocalCacheEnabled) {
                document.addEventListener(TQ.EVENT.FILE_SYSTEM_READY, onFileSystemReady, false);
                DeviceService.initialize();
            } else {
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
            if (!opus && $stateParams.shareCode) {
                opus = $stateParams.shareCode;
            }
            // opus = "100_12345678_123_1234567890";
            // opus = "100_00000016_123_1234567890";
            // opus = "100_00000025_123_1234567890";
            if (opus) {
                WCY.getWcy(opus);
            } else {
                WCY.start();
            }
            //WxService.init();
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
            configCanvas: configCanvas,
            onAppStarting: setOnAppStarting,
            onAppStarted: setOnAppStarted
        }
}
