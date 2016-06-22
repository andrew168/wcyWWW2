/**
 * Created by admin on 9/11/2015.
 * NetService： 上传素材（image或者mp3）到clound服务器，主要接口是
 *     * uploadOne
 * 在controller中直接使用
 */
angular.module('starter').factory("NetService", NetService);
NetService.$injection = ['$q', '$http', '$cordovaFileTransfer', 'Upload'];

function NetService($q, $http, $cordovaFileTransfer, Upload) {
    var baseUrl = "http://bone.udoido.cn/";
    var urlConcat = TQ.Base.Utility.urlConcat;
    var IMAGE_CLOUD_URL = TQ.Config.MAT_UPLOAD_API;
    var C_MAN_URL = TQ.Config.MAN_HOST + '/material';

    var TYPE_IMAGE = 'image',
        TYPE_AUDIO = 'audio';

    function uploadImages(files, onSuccess) {
        if (!files) return;
        var surplus = files.length;
        function _onSuccess() {
            if ((--surplus) == 0) {
                onSuccess();
            }
        }

        angular.forEach(files, function (file) {
            uploadOne(file, _onSuccess);
        });
    }

    function uploadOne(file) {
        var q = $q.defer();
        TQ.Assert.isTrue(!!file, "文件不能为null");
        var option;
        if (isLocalFile(file)) {
            option = {
                filename: file.name,
                type: file.type
            };

            if (!!file.isWx) {
                TQ.Log.alertInfo("isWx");
                TQ.Log.alertInfo(JSON.stringify(file));
                get(file.path);
            }
        } else {
            var filename = hasFileName(file) ? file.name : getImageNameWithoutExt();
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
                    data.file = hasFileName(file) ? file.data : file;
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
                TQ.Log.alertInfo("error" + angular.toJson(event));
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

    function getByXHR(uri) {
        // CHROME - browsers
        var xhr = new XMLHttpRequest();
        TQ.Log.alertInfo("X1: " + uri);
        xhr.open('GET', uri, true);
        xhr.responseType = 'blob';
        var headers = {};
        xhr.onload = function () {
            TQ.Log.alertInfo("X2");
            TQ.Log.alertInfo(xhr.response.size + ",  " + xhr.response.type);
            if (xhr.response && (xhr.status === 200 || xhr.status === 0)) {
                TQ.Log.alertInfo("X2.5");
            } else {
                TQ.Log.alertInfo('Image could not be downloaded: ' + xhr.status);
            }
        };
        xhr.onerror = function () {
            TQ.Log.alertInfo("X3 : " + xhr.status);
        };
        xhr.send();
    }

    function get(url, onSuccess, onError) {
        TQ.Log.alertInfo("Get 1 : " + url);
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
            TQ.Log.alertInfo("Get 3");
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
            TQ.Log.alertInfo(" 4 ImageCache OK??");
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

    function isLocalFile(data) {
        return ((typeof data === 'object') && (!!data.type))
    }

    function hasFileName(file) {
        return (!!file.name);
    }

    return {
        TYPE_IMAGE: TYPE_IMAGE,
        TYPE_AUDIO: TYPE_AUDIO,
        initialize: initialize,
        get: get,
        put: put,
        uploadImages: uploadImages,
        uploadOne: uploadOne,
        update: update,
        del: del
    }
}
