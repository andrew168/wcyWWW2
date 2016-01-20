/**
 * Created by admin on 9/11/2015.
 * NetService： 上传素材（image或者mp3）到clound服务器，主要接口是
 *     * uploadData
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

            function uploadImages(files, onSuccess){
                if (!files) return;
                var surplus = files.length;
                function _onSuccess() {
                    if ((--surplus) == 0) {
                        onSuccess();
                    }
                }

                angular.forEach(files, function(file){
                    uploadOneImage(file, _onSuccess);
                });
            }

            function uploadOneImage(file) {
                var q = $q.defer();
                if (file && !file.$error) {
                    var option = {
                        filename: file.name,
                        type: file.type
                    };

                    createMatId(option).
                        success(function (data) {
                            console.log(JSON.stringify(data));
                            data.api_key = TQ.Config.Cloudinary.api_key;
                            doUploadOne(file, data).progress(function (e) {
                                file.progress = Math.round((e.loaded * 100.0) / e.total);
                                file.status = "Uploading... " + file.progress + "%";
                            }).success(function (data, status, headers, config) {
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
                }
                return q.promise;
            }

            function doUploadOne(file, data) {
                return Upload.upload({
                    url: IMAGE_CLOUD_URL,
                    fields: data,
                    file: file
                });
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

            function uploadData(imageData, onSuccess, onError, onProgress) {
                var filename = getImageNameWithoutExt();
                var options = {
                    file: imageData,
                    filename:filename,
                    tags: 'myphotoalbum',
                    context: 'photo=' + "No"
                };

                submitImage(options, onSuccess, onError, onProgress);
            }

            var counter = 100;
            function getImageNameWithoutExt() {
                // the Cloundary will automatically add extion '.png'
                return "p" + (counter++);
            }

            var getSignature = function (option) {
                return $http.get(C_SIGNATURE_URL + "?filename=" + option.filename);
            };

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

            var submitImage = function (option, onSuccess, onError, onProgress) {
                getSignature(option).
                    success(function (data) {
                        console.log(JSON.stringify(data));
                        data.file = option.file;
                        data.api_key = TQ.Config.Cloudinary.api_key;
                        doSubmitImage(data, onSuccess, onError, onProgress);
                    }).
                    error(function (event) {
                        alert("error" + angular.toJson(event));
                    });
            };

            function doSubmitImage(option, onSuccess, onError, onProgress) {
                var url = IMAGE_CLOUD_URL;
                var result = {};
                $http.post(url, angular.toJson(option)).
                    success(function (data) {
                        console.log("Successfully saved to " + data.url);
                        result.imageUrl = data.url;
                        if (onSuccess) {
                            onSuccess(data);
                        }
                    }).
                    error(function (error) {
                        alert(angular.toJson(error));
                        result.imageUrl = null;
                        if (onError) {
                            onError(error);
                        }
                    });
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
                uploadData: uploadData,
                uploadImages: uploadImages,
                uploadOneImage: uploadOneImage,
                update: update,
                del: del
            }
        }]);
