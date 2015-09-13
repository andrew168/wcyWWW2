/**
 * Created by admin on 9/9/2015.
 */
angular.module('starter')
    .factory("FileIO", function ($cordovaFileTransfer, $cordovaFile) {
        var rootFolder = "";

        function createDir(dir) {
            rootFolder = cordova.file.dataDirectory;
            return $cordovaFile.createDir(rootFolder, dir, false);
        }

        function saveFile(fullPath, data) {
            // WRITE
            rootFolder = cordova.file.dataDirectory;
            return $cordovaFile.writeFile(rootFolder, fullPath, data, true);
        }

        function readFile(fullPath) {
            rootFolder = cordova.file.dataDirectory;
            return $cordovaFile.readAsText(rootFolder, fullPath);
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
    });
