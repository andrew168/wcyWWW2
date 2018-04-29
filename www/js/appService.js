/**
 * Created by Andrewz on 5/8/2016.
 */
angular.module('starter').factory('AppService', AppService);

AppService.$inject = ['$stateParams', '$timeout', 'WCY', 'NetService', 'DeviceService',
        'Setup', 'UserService'];

function AppService($stateParams, $timeout, WCY, NetService, DeviceService,
              Setup, UserService) {

        var STATE_LOADED = 1,
            STATE_STARTING = 2,
            STATE_STARTED = 3;
        var _state = STATE_LOADED,
            _initialized = false,
            _onAppStarting = null,
            _onAppStarted = null; // onAppStartDefault;

        function configCanvas() {
            TQ.State.updateDeviceInfo();
            TQ.State.determineWorkingRegion();
            TQ.Graphics.setCanvas();
            if (currScene) {
                TQ.DirtyFlag.setScene();
            }

            TQ.Log.debugInfo("scren is: (" + TQ.Config.workingRegionWidth + ", " + TQ.Config.workingRegionHeight +")"
                + "orientation = " + TQ.Config.orientation);
        }

    function _init() {
        if (UserService.canAutoLogin()) {
            UserService.tryAutoLogin().then(doInit);
        } else {
            doInit();
        }
    }

    function doInit() {
        //remove_debugger_begin
        //TQ.Log.setLevel(TQ.Log.INFO_LEVEL);
        //remove_debugger_end

        if (_initialized) {
                TQ.Log.error("Duplicated call in _init");
                return;
            }
            if (!TQ.Utility.isSupportedEnvironment()) {
                var msg = TQ.Locale.getStr('please install') +' <a href="https://www.google.ca/chrome/browser/features.html" style="font-weight: bold; text-decoration: underline">' +
                    TQ.Locale.getStr('chrome') + '</a>！';
                TQ.MessageBox.prompt(msg);
                return;
            }
            _initialized = true;
            TQ.Log.debugInfo("_init");
            configCanvas();
            if (TQ.Config.LocalCacheEnabled) {
                document.addEventListener(TQ.EVENT.FILE_SYSTEM_READY, onFileSystemReady, false);
                DeviceService.initialize();
            } else {
                onFileSystemReady();
            }
            TQ.Log.checkPoint('file system ready');
            TQ.Locale.initialize();
            if (_state < STATE_STARTING) { // 由于autoLogin的影响， 可能此段函数被滞后了。
                _state = STATE_STARTING
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
            _state = STATE_STARTED;
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
            if (_state === STATE_STARTED) {
                _onAppStarted();
            }
        }

        function setOnAppStarting(fn) {
            _onAppStarting = fn;
            if (_state >= STATE_STARTING) {
                _onAppStarting();
            }
        }

        return {
            init: _init,
            configCanvas: configCanvas,
            onAppStarting: setOnAppStarting,
            onAppStarted: setOnAppStarted
        }
}
