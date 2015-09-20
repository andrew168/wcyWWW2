/**
 * Created by admin on 9/13/2015.
 * 建立系统目录
 * ToDo：避免重复建立
 */
angular.module('starter')
.factory('Setup', function(FileService, NetService, DeviceService) {
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

            dirCounter = 0;
            FileService.createDir(dirs[dirCounter], onSuccess, onError);
        }

        function onSuccess(success) {
            dirCounter++;
            onDirCreated();
        }

        function onError(error) {
            dirCounter++;
            TQ.Log.error("在创建目录的时候出错！！！");
            if (!!error) {
                TQ.Log.error(JSON.stringify(error));
            }

            onDirCreated();
        }

        //对于Android，处理速度慢，不能使用for循环连续发出命令，必须使用这种 回调方式
        function onDirCreated() {
            if (dirCounter === dirs.length) {
                TQ.Base.Utility.triggerEvent(document, TQ.EVENT.DIR_READY);
            } else {
                FileService.createDir(dirs[dirCounter], onSuccess, onError);
            }
        }

        function initialize() {
            createFolders();
        }

        return {
            initialize: initialize
        }
    });
