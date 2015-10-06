/**
 * Created by admin on 9/11/2015.
 */
angular.module('starter')
.factory("NetService", ['$cordovaFileTransfer', 'DeviceService',
        function ($cordovaFileTransfer, DeviceService) {
        var baseUrl = "http://bone.udoido.cn/";
        var urlConcat = TQ.Base.Utility.urlConcat;

        function get(path, onSuccess, onError) {
            path = TQ.RM.toRelative(path);
            var url = urlConcat(baseUrl, path);
            console.log("get from : " + url);

            var targetPath = DeviceService.getFullPath(path);
            var trustHosts = true;
            var options = {};

            if (TQ.Base.Utility.isMobileDevice()) {
                $cordovaFileTransfer.download(url, targetPath, options, trustHosts)
                    .then(function (result) {
                        console.log(result);
                        onSuccess(result);
                    }, function (err) {
                        console.log(err);
                        onError(err);
                    }, function (progress) {
                        var ratio = progress.loaded / progress.total;
                        console.log(ratio + ": " + progress);
                        // $timeout(function () {
                        // $scope.downloadProgress = (progress.loaded / progress.total) * 100;
                        // })
                    });
            } else {
                ImgCache.cacheFile(url, onSuccess, onError);
            }
        }

        function put(path) {
            var url = urlConcat(baseUrl, path);
            console.log("put " + path + " to ===> " + url);
        }

        function update(path) {
            var url = urlConcat(baseUrl, path);
            console.log("update: " + path + " to ==> " + url);
        }

        function del(path) {  // delete is reserved key word!!!
            var url = urlConcat(baseUrl, path);
            console.log("delete: " + url);
        }

        return {
            get: get,
            put: put,
            update: update,
            del: del
        }
    }]);
