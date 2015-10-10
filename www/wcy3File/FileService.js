/**
 * Created by admin on 9/9/2015.
 */
angular.module('starter')
    .factory("FileService", ['$cordovaFileTransfer',
        '$cordovaFile', 'DeviceService',
        function ($cordovaFileTransfer, $cordovaFile, DeviceService) {
        var rootFolder = "";
        function createDir(dir, onSuccess, onError) {
            // 确保建立， 避免重复建立
            rootFolder = DeviceService.getRootFolder();
            var finalPath = DeviceService.getFullPath(dir);
            if (dir[dir.length - 1] === '/') {
                dir = dir.substr(0, dir.length - 1);
            }

            if (TQ.Base.Utility.isMobileDevice() && TQ.Base.Utility.isCordovaDevice()) {
                $cordovaFile.checkDir(rootFolder, dir)
                    .then(function (success) {
                        if (!!onSuccess) onSuccess(success);
                    }, function (error) {
                        $cordovaFile.createDir(rootFolder, dir, false)
                            .then(onSuccess, onError);
                    });
            } else {
                ImgCache.createDir(dir, onSuccess, onError);
            }
        }

        function saveFile(fullPath, data, onSuccess, onError) {
            // WRITE
            if (!TQ.Base.Utility.isMobileDevice()) {
                return ImgCache.WriteFile(fullPath, data, onSuccess, onError);
            }

            $cordovaFile.writeFile(DeviceService.getRootFolder(), fullPath, data, true)
                .then(onSuccess, onError);
        }

        function onSuccess(info) {
            if (!!info) {
                TQ.Log.info(JSON.stringify(info));
            }
        }

        function onError(e) {
            if (!!e) {
                TQ.Log.info(JSON.stringify(e));
            }
        }

        function readFile(fullPath) {
            // WRITE
            if (!TQ.Base.Utility.isMobileDevice()) {
                return;
            }
            return $cordovaFile.readAsText(DeviceService.getRootFolder(), fullPath);
        }

        function testFilePathOP() {
            rootFolder = cordova.file.dataDirectory;
            $cordovaFile.getFreeDiskSpace()
                .then(function (success) {
                    // success in kilobytes
                    console.log(success);
                }, function (error) {
                    console.log(error);
                });

            // CHECK
            $cordovaFile.checkDir(rootFolder, "demoDir1")
                .then(function (success) {
                    console.log(success);
                }, function (error) {
                    console.log(error);
                });

            $cordovaFile.checkFile(rootFolder, "demoFile1.txt")
                .then(function (success) {
                    console.log(success);
                }, function (error) {
                    console.log(error);
                });

            // CREATE
            $cordovaFile.createDir(rootFolder, "demoDir1", false)
                .then(function (success) {
                    console.log(success);
                }, function (error) {
                    console.log(error);
                });

            $cordovaFile.createFile(rootFolder + "/demoDir1", "demoFile2.txt", true)
                .then(function (success) {
                    console.log(success);
                }, function (error) {
                    console.log(error);
                });

            // WRITE
            $cordovaFile.writeFile(rootFolder, "demoFile3.txt", "demo data huge buffer end", true)
                .then(function (success) {
                    console.log(success);
                }, function (error) {
                    console.log(error);
                });

            // READ
            $cordovaFile.readAsText(rootFolder, "demoFile3.txt")
                .then(function (success) {
                    console.log(success);
                }, function (error) {
                    console.log(error);
                });

            $cordovaFile.writeExistingFile(rootFolder, "demoFile3.txt", "overriteFile")
                .then(function (success) {
                    console.log(success);
                }, function (error) {
                    console.log(error);
                });

            // READ
            $cordovaFile.readAsText(rootFolder, "demoFile3.txt")
                .then(function (success) {
                    console.log(success);
                }, function (error) {
                    console.log(error);
                });

            // MOVE
            $cordovaFile.moveDir(rootFolder, "dir", cordova.file.tempDirectory, "demoDir1")
                .then(function (success) {
                    console.log(success);
                }, function (error) {
                    console.log(error);
                });

            $cordovaFile.moveFile(rootFolder, "demoFile3.txt", cordova.file.tempDirectory)
                .then(function (success) {
                    console.log(success);
                }, function (error) {
                    console.log(error);
                });

            // COPY
            $cordovaFile.copyDir(rootFolder, "dir", cordova.file.tempDirectory, "demoDir1")
                .then(function (success) {
                    console.log(success);
                }, function (error) {
                    console.log(error);
                });

            $cordovaFile.copyFile(rootFolder, "demoFile3.txt", cordova.file.tempDirectory, "demoFile2.txt")
                .then(function (success) {
                    console.log(success);
                }, function (error) {
                    console.log(error);
                });

/*            // REMOVE
            $cordovaFile.removeDir(rootFolder, "demoDir1")
                .then(function (success) {
                    console.log(success);
                }, function (error) {
                    console.log(error);
                });

            $cordovaFile.removeFile(rootFolder +"/demoDir1", "demoFile1.txt")
                .then(function (success) {
                    console.log(success);
                }, function (error) {
                    console.log(error);
                });

            $cordovaFile.removeRecursively(rootFolder, "demoDir1")
                .then(function (success) {
                    console.log(success);
                }, function (error) {
                    console.log(error);
                });
 */
        }

        return {
            createDir: createDir,
            saveFile: saveFile,
            readFile: readFile,
            testFilePathOP: testFilePathOP
        }
    }]);
