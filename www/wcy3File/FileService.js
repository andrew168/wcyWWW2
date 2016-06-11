/**
 * Created by admin on 9/9/2015.
 * FileService：提供本地文件存取IO，用于WCY文件及其screenshot的保存
 *     （对App是本地文件， 对PC用cache文件系统来模拟。
 * 主要接口是
 *    .saveImage64
 *    .saveFile
 * 在WCYService中使用
 */
angular.module('starter').factory("FileService", FileService);
FileService.$injection = ['$cordovaFileTransfer',
        '$cordovaFile', 'DeviceService'];

function FileService($cordovaFileTransfer, $cordovaFile, DeviceService) {
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
            var cachePath = TQ.RM.toCachePath(fullPath);
            ImgCache.WriteFile(fullPath, cachePath, data, onSuccess, onError);
            return cachePath;
        }

        var fullname = TQ.Base.Utility.urlConcat(DeviceService.getRootFolder(), fullPath);
        $cordovaFile.writeFile(DeviceService.getRootFolder(), fullPath, data, true)
            .then(onSuccess, onError);

        return fullname;
    }

    function saveImage64(fullPath, image64Data, onSuccess, onError) {
        image64Data = image64Data.replace(/^data:image\/\w+;base64,/, "");
        image64Data = new Blob([Base64Binary.decodeArrayBuffer(image64Data)], {type: 'image/png', encoding: 'utf-8'});
        return saveFile(fullPath, image64Data, onSuccess, onError);
    }

    function saveWcy(fullPath, data, onSuccess, onError) {
        data = new Blob([data], {type: 'text/plain'});
        return saveFile(fullPath, data, onSuccess, onError);
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
        saveImage64: saveImage64,
        saveWcy: saveWcy,
        readFile: readFile,
        testFilePathOP: testFilePathOP
    }
}
