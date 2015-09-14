/**
 * Created by admin on 9/11/2015.
 */
angular.module('starter')
.factory("NetService", function ($cordovaFileTransfer, DeviceService) {
        var baseUrl = "http://bone.udoido.cn/mcImages/";

        function get(path) {
            var url = baseUrl + path;
            console.log("get from : " + url);

            var targetPath = DeviceService.getFullPath(TQ.Config.IMAGES_CORE_PATH + path);
            var trustHosts = true;
            var options = {};

            $cordovaFileTransfer.download(url, targetPath, options, trustHosts)
                .then(function(result) {
                    console.log(result);
                }, function(err) {
                    console.log(err);
                }, function (progress) {
                    var ratio = progress.loaded / progress.total;
                    console.log(ratio + ": " + progress);
                    // $timeout(function () {
                       // $scope.downloadProgress = (progress.loaded / progress.total) * 100;
                    // })
                });
        }

        function put(path) {
            var url = baseUrl + path;
            console.log("put " + path + " to ===> " + url);
        }

        function update(path) {
            var url = baseUrl + path;
            console.log("update: " + path + " to ==> " + url);
        }

        function del(path) {  // delete is reserved key word!!!
            var url = baseUrl + path;
            console.log("delete: " + url);
        }

        return {
            get: get,
            put: put,
            update: update,
            del: del
        }
    });
