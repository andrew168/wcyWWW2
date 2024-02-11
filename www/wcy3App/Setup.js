/**
 * Created by admin on 9/13/2015.
 * 建立系统目录
 * ToDo：避免重复建立
 */
angular.module("starter").factory("Setup", Setup);
Setup.$inject = ["FileService", "DeviceService"];

function Setup(FileService, DeviceService) {
  var dirCounter = 0;
  var dirs = [TQ.Config.IMAGES_CORE_PATH,
    TQ.Config.SOUNDS_PATH,
    TQ.Config.VIDEOS_CORE_PATH,

    TQ.Config.WORKS_CORE_PATH,
    TQ.Config.SCENES_CORE_PATH,
    TQ.Config.SCREENSHOT_CORE_PATH,

    TQ.Config.TEMP_CORE_PATH,
    TQ.Config.LOG_CORE_PATH];

  function createFolders() {
    if (!DeviceService.isReady()) {
      TQ.Log.error("Device not ready! in createFolders");
      return;
    }

    TQ.Config.setResourceHost(DeviceService.getRootFolder());

    if (TQ.Config.LocalCacheEnabled) {
      dirCounter = 0;
      FileService.createDir(dirs[dirCounter], onSuccess, onError);
    } else {
      _ready();
    }
  }

  function onSuccess(success) {
    dirCounter++;
    onDirCreated();
  }

  function onError(error) {
    TQ.Log.error("在创建目录的时候出错！！！: " + dirs[dirCounter]);
    if (error) {
      TQ.Log.error(JSON.stringify(error));
    }

    dirCounter++;
    onDirCreated();
  }

  // 对于Android，处理速度慢，不能使用for循环连续发出命令，必须使用这种 回调方式
  function onDirCreated() {
    if (dirCounter >= dirs.length) {
      _ready();
    } else {
      FileService.createDir(dirs[dirCounter], onSuccess, onError);
    }
  }
  function initialize() {
    createFolders();
  }

  function _ready() {
    TQ.Base.Utility.triggerEvent(document, TQ.EVENT.DIR_READY);
  }

  return {
    initialize: initialize
  };
}
