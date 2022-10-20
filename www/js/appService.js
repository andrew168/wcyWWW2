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
    if (currScene) {
      TQ.State.canvasStyle = TQ.Graphics.setCanvas();
      TQ.DirtyFlag.setScene();
    }

    TQ.Log.debugInfo("scren is: (" + TQ.Config.workingRegionWidth + ", " + TQ.Config.workingRegionHeight + ")"
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


    // Chrome规定：必须用户操作之后，才能播放Audio和Video，
    // 如果是从shared link直接打开播放， 则必须要提示用户操作一下，否则video的不触发canplay事件
    // iOS也一样
    TQ.State.needUserClickToPlayAV = (!!TQ.QueryParams.shareCode &&
            (parseInt(TQ.Utility.shareCode2Id(TQ.QueryParams.shareCode)) > 0));

    if (_initialized) {
      TQ.Log.error("Duplicated call in _init");
      return;
    }
    if (!TQ.Utility.isSupportedEnvironment()) {
      var msg = TQ.Locale.getStr('please use android mobile');
      // +' <a href="https://www.google.ca/chrome/browser/features.html" style="font-weight: bold; text-decoration: underline">' +
      // TQ.Locale.getStr('chrome') + '</a>！';
      TQ.MessageBox.prompt(msg, function () {
        msg = TQ.Locale.getStr('please copy this page to technical support') + ': support@udoido.com. \n\n\n\r\n\r';
        $timeout(TQ.MessageBox.prompt(msg + navigator.userAgent + ' \n\r' + navigator.vendor));
      });
      return;
    }
    _initialized = true;
    TQ.Log.debugInfo("_init");
    document.addEventListener(TQ.EVENT.SYSTEM_ERROR, onSystemError, false);
    configCanvas();
    if (TQ.Config.LocalCacheEnabled) {
      document.addEventListener(TQ.EVENT.FILE_SYSTEM_READY, onFileSystemReady, false);
      DeviceService.initialize();
    } else {
      onFileSystemReady();
    }
    TQ.Log.checkPoint('file system ready');
    if ((!TQ.Env || !TQ.Env.lang) && !TQ.QueryParams.noLocale) {
      TQ.Log.error('must setup default language!');
    }
    angular.element(document).ready(function () {
      if (!(TQ.QueryParams && TQ.QueryParams.noLocale)) {
        TQ.Locale.initialize(TQ.Env.lang);
      }
    });

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

  function onSystemError(evt) {
    if (evt) {
      TQ.Log.error(evt.type);
      TQ.Log.error(evt.data);
      TQ.Log.error(TQUtility.stringifyIgnoreCycle(evt));
    }
    TQ.MessageBox.confirm(TQ.Locale.getStr('发现错误：无法加载系统文件！ 建议：1）检查网络是否正常连接；2）重新加载。'));
  }

  return {
    init: _init,
    configCanvas: configCanvas,
    onAppStarting: setOnAppStarting,
    onAppStarted: setOnAppStarted
  }
}
