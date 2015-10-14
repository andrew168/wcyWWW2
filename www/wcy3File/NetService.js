/**
 * Created by admin on 9/11/2015.
 */
angular.module('starter')
    .factory("NetService", ['$cordovaFileTransfer', 'DeviceService',
        function ($cordovaFileTransfer, DeviceService) {
            var baseUrl = "http://bone.udoido.cn/";
            var urlConcat = TQ.Base.Utility.urlConcat;

            function get(url, onSuccess, onError) {
                var urlSource, urlTarget;
                var trustHosts = true;
                var options = {};

                if (typeof url === "string") {
                    urlSource = url;
                    urlTarget = TQ.RM.toCachePath(urlSource);
                } else {
                    urlSource = url.source;
                    urlTarget = url.target;
                }

                if (TQ.Base.Utility.isMobileDevice() && TQ.Base.Utility.isCordovaDevice()) {
                    $cordovaFileTransfer.download(urlSource, urlTarget, options, trustHosts)
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
                    ImgCache.cacheFile(urlSource, urlTarget, onSuccess, onError);
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

            function initialize() {
                document.addEventListener(TQ.DownloadManager.DOWNLOAD_EVENT, onDownload, false);
            }

            // private
            function onDownload(evt) {
                var data = evt.data;
                function onSuccess() {
                    TQ.DownloadManager.onCompleted(data);
                }

                function onError(error) {
                    TQ.DownloadManager.onError(error, data);
                }

                if (data) {
                    get(data, onSuccess, onError);
                }
            }

            return {
                initialize : initialize,
                get: get,
                put: put,
                update: update,
                del: del
            }
        }]);
