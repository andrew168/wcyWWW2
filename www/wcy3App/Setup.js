/**
 * Created by admin on 9/13/2015.
 * 建立系统目录
 * ToDo：避免重复建立
 */
angular.module('starter')
.factory('Setup', function(FileService, NetService, DeviceService) {
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

            for (var i = 0; i < dirs.length; i++) {
                FileService.createDir(dirs[i], onSuccess, onError);
            }
        }

        var dirCounter = 0;
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

        function onDirCreated() {
            if (dirCounter === dirs.length) {
                TQ.Base.Utility.triggerEvent(document, TQ.EVENT.DIR_READY);
            }
        }

        function initialize() {
            createFolders();
        }

        return {
            initialize: initialize
        }
    });
