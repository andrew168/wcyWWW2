/**
 * Created by admin on 9/13/2015.
 */
angular.module('starter')
.factory('Setup', function(FileService, NetService, DeviceService) {
        function createFolders() {
            if (!DeviceService.isReady()) {
                TQ.Log.error("Device not ready! in createFolders");
                return;
            }
            FileService.createDir(TQ.Config.IMAGES_CORE_PATH);
            FileService.createDir(TQ.Config.SOUNDS_PATH);
            FileService.createDir(TQ.Config.VIDEOS_CORE_PATH);

            FileService.createDir(TQ.Config.WORKS_CORE_PATH);
            FileService.createDir(TQ.Config.SCENES_CORE_PATH);
            FileService.createDir(TQ.Config.SCREENSHOT_CORE_PATH);

            FileService.createDir(TQ.Config.TEMP_CORE_PATH);
            FileService.createDir(TQ.Config.LOG_CORE_PATH);
        }

        function initialize() {
            createFolders();
        }

        return {
            initialize: initialize
        }
    });
