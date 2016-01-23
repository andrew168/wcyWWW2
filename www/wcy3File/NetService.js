/**
 * Created by admin on 9/11/2015.
 * NetService： 上传素材（image或者mp3）到clound服务器，主要接口是
 *     * uploadOne
 * 在controller中直接使用
 */
angular.module('starter')
    .factory("NetService", ['$q', '$http', '$cordovaFileTransfer', 'Upload',
        function ($q, $http, $cordovaFileTransfer, Upload) {
            var baseUrl = "http://bone.udoido.cn/";
            var urlConcat = TQ.Base.Utility.urlConcat;
            var IMAGE_CLOUD_URL = "https://api.cloudinary.com/v1_1/" + TQ.Config.Cloudinary.name + "/upload";
            var C_SIGNATURE_URL =TQ.Config.AUTH_HOST +'/getCSignature';  // Cloudary signature;
            var C_MAN_URL = TQ.Config.MAN_HOST + '/material';

            var TYPE_IMAGE = 'image',
                TYPE_AUDIO = 'audio';

            function uploadImages(files, onSuccess){
                if (!files) return;
                var surplus = files.length;
                function _onSuccess() {
                    if ((--surplus) == 0) {
                        onSuccess();
                    }
                }

                angular.forEach(files, function(file){
                    uploadOneLocalFile(file, _onSuccess);
                });
            }

            function uploadOneLocalFile(file) {
                var q = $q.defer();
                TQ.Assert.isTrue(!!file, "文件不能为null");
                var option;
                if (isLocalFile(file)) {
                    option = {
                        filename: file.name,
                        type: file.type
                    };
                } else {
                    var filename = getImageNameWithoutExt();
                    option = {
                        filename: filename,
                        type: TYPE_IMAGE,
                        tags: 'myphotoalbum',
                        context: 'photo=' + "No"
                    };
                }

                createMatId(option).
                    success(function (data) {
                        console.log(JSON.stringify(data));
                        data.api_key = TQ.Config.Cloudinary.api_key;
                        var res;
                        if (isLocalFile(file)) {
                            data.file = file;
                            res = doUploadLocalFile(data);
                            res.progress(function (e) {
                                file.progress = Math.round((e.loaded * 100.0) / e.total);
                                file.status = "Uploading... " + file.progress + "%";
                            });
                        } else {
                            data.file = file;
                            res = doSubmitImage64(data);
                        }

                        res.success(function (data, status, headers, config) {
                            file.result = data;
                            console.log(data);
                            data.type = file.type;
                            updateMat(data);
                            q.resolve(data);
                        }).error(function (data, status, headers, config) {
                            file.result = data;
                            q.reject(data);
                        });
                    })
                    .error(function (event) {
                        alert("error" + angular.toJson(event));
                        q.reject(event);
                    });

                return q.promise;
            }

            function doUploadLocalFile(data) {
                return Upload.upload({
                    url: IMAGE_CLOUD_URL,
                    fields: data
                });
            }

            function doSubmitImage64(data) {
                var url = IMAGE_CLOUD_URL;
                return $http.post(url, angular.toJson(data));
            }

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
                            // $scope_downloadProgress = (progress.loaded / progress.total) * 100;
                            // })
                        });
                } else {
                    ImgCache.cacheFile(urlSource, urlTarget, onSuccess, onError);
                }
            }

            function put(path) {
                console.error('depreciated??? replace by post??');
                var url = urlConcat(baseUrl, path);
                console.log("put " + path + " to ===> " + url);
            }

            var counter = 100;
            function getImageNameWithoutExt() {
                // the Cloundary will automatically add extion '.png'
                return "p" + (counter++);
            }

            var createMatId = function (option) {
                return $http.post(C_MAN_URL, angular.toJson(option));
            };

            function updateMat(data) {
                var data2 = {
                    path: TQ.RM.toRelative(data.url),
                    public_id: data.public_id,
                    type: data.type
                };

                return $http.post(C_MAN_URL, angular.toJson(data2));
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

            // private functions:
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

            function isLocalFile(file) {
                return ((typeof file === 'object') && (!!file.type))
            }

            return {
                TYPE_IMAGE : TYPE_IMAGE,
                TYPE_AUDIO : TYPE_AUDIO,
                initialize : initialize,
                get: get,
                put: put,
                uploadImages: uploadImages,
                uploadOne: uploadOneLocalFile,
                update: update,
                del: del
        }
        }]);
