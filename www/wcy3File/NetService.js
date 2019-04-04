/**
 * Created by admin on 9/11/2015.
 * NetService： 上传素材（image或者mp3）到clound服务器，主要接口是
 *     * uploadOne
 * 在controller中直接使用
 */
angular.module('starter').factory("NetService", NetService);
NetService.$inject = ['$q', '$http', '$cordovaFileTransfer', 'Upload'];

function NetService($q, $http, $cordovaFileTransfer, Upload) {
    var baseUrl = TQ.Config.BONE_HOST,
        urlConcat = TQ.Base.Utility.urlConcat,
        IMAGE_CLOUD_URL = TQ.Config.MAT_UPLOAD_API,
        C_OPUS_URL = TQ.Config.MAN_HOST + '/wcyList';
        C_MAN_URL = TQ.Config.MAN_HOST + '/material';

    function isFullPath(url) {
        var protocols = ['http://', 'https://'];
        for (var i = 0; i < protocols.length; i++) {
            if (url.indexOf(protocols[i]) === 0) {
                return true;
            }
        }
        return false;
    }

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

    function uploadOne(file, matType, option) { // upload one material, fileOrBuffer
        option = option || {};
        var q = $q.defer();
        TQ.Assert.isTrue(!!file, "文件不能为null");
        if (option.type !== undefined) {
            TQ.Log.error("==> upgrade: type to matType");
        }
        option.matType = matType;

        if (TQUtility.isLocalFileOrBlob(file)) {
            if (!file.name) {
                file.name = generateName(file);
            }
            option.filename = file.name;
            if (!!file.isWx) {
                TQ.Log.alertInfo("isWx");
                TQ.Log.alertInfo(JSON.stringify(file));
                get(file.path);
            }
        } else {
            var filename = hasFileName(file) ? file.name :
                (isFullPath(file) ? file : getImageNameWithoutExt());
            option.filename = filename;
            option.tags = 'myphotoalbum';
            option.context = 'photo=' + "No";
        }
        createMatId(option)
            .success(onMatIdCreated)
            .error(onError);

        function onError(event, status, headers, config) {
            TQ.Log.alertInfo("error" + angular.toJson(event));
            q.reject(event);
        }

        function onMatIdCreated(pkg) {
            if (pkg.existPath) {
                pkg.url = pkg.existPath;
                q.resolve(pkg);
            } else {
                return doUploadMat(pkg);
            }
        }

        function doUploadMat(signData) {
            doUploadImage(signData, file, option).success(onLoadedSuccess).error(onError);
        }

        function onLoadedSuccess(data, status, headers, config) {
            file.result = data;
            TQ.Log.debugInfo(data);
            data.type = matType; // ToDo: delete type, which is replaced by matType
            data.matType = matType;
            updateMat(data);
            q.resolve(data);
            TQ.MessageBox.hide();
        }

        return q.promise;
    }

    function doUploadImage(signData, fileOrBuffer, option) {
        if (option && !option.useBackgroundMode) {
            TQ.MessageBox.showWaiting(TQ.Locale.getStr('uploading...'));
        }
        // TQ.Log.debugInfo(JSON.stringify(signData)); // 图像数据太大
        signData.api_key = TQ.Config.Cloudinary.api_key;
        var res;
        if (TQUtility.isLocalFileOrBlob(fileOrBuffer)) {
            signData.file = fileOrBuffer;
            res = doUploadLocalFile(signData);
            res.progress(function (e) {
                fileOrBuffer.progress = Math.round((e.loaded * 100.0) / e.total);
                fileOrBuffer.status = "Uploading... " + fileOrBuffer.progress + "%";
            });
        } else {
            signData.file = hasFileName(fileOrBuffer) ? fileOrBuffer.data : fileOrBuffer;
            res = doSubmitImage64(signData);
        }

        return res;
    }

    function doUploadLocalFile(data) {
        return Upload.upload({
            url: IMAGE_CLOUD_URL,
            fields: data
        });
    }

    function doSubmitImage64(data) {
        return $http.post(IMAGE_CLOUD_URL, angular.toJson(data));
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
                    TQ.Log.debugInfo(result);
                    onSuccess(result);
                }, function (err) {
                    TQ.Log.error(err);
                    onError(err);
                }, function (progress) {
                    var ratio = progress.loaded / progress.total;
                    TQ.Log.debugInfo(ratio + ": " + progress);
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
        TQ.Log.debugInfo("put " + path + " to ===> " + url);
    }

    var counter = 100;

    function getImageNameWithoutExt() {
        // the Cloundary will automatically add extion '.png'
        return "p" + (counter++);
    }

    var createMatId = function (option) {
        if (!option.useBackgroundMode) {
            // TQ.MessageBox.showWaiting(TQ.Locale.getStr('get material ID...'));
        }
        return $http.post(C_MAN_URL, angular.toJson(option));
    };

    function updateMat(data) {
        var data2 = {
            path: TQ.RM.toRelative(data.url),
            public_id: data.public_id,
            matType: data.type
        };

        return doUpdateMat(data2);
    }

    function requestToShareMat(data) {
        data.requestToShare = true;
        doUpdateMat(data);
    }

    function requestToBanMat(data) {
        data.requestToBan = true;
        doUpdateMat(data);
    }

    function shareMat(data) {
        data.share = true;
        doUpdateMat(data);
    }

    function banMat(data) {
        data.ban = true;
        doUpdateMat(data);
    }

    function requestToShareOpus(opus) {
        var url = C_OPUS_URL + "/apply/" + opus.wcyId;
        doUpdateOpus(url);
    }

    function shareOpus(opus) { //批准发布作品，approveToShareOpus
        var url = C_OPUS_URL + "/approve/" + opus.wcyId;
        return doUpdateOpus(url);
    }

    function refineOpus(opus) { //批准发布作品，approveToShareOpus
      var url = C_OPUS_URL + "/refine/" + opus.wcyId;
      return doUpdateOpus(url);
    }

    function requestToBanOpus(opus) {
        TQ.Log.warn("服务器尚未实现此命令，暂时")
        var url = C_OPUS_URL + "/requestToBan/" + opus.wcyId;
        doUpdateOpus(url);
    }

    function banOpus(opus) {
        var url = C_OPUS_URL + "/ban/" + opus.wcyId;
        doUpdateOpus(url);
    }

    function doUpdateOpus(url) {
        return $http.get(url).then(function (pkg) { // 发出event， 好让dataService等更新自己
            TQUtility.triggerEvent(document, TQ.EVENT.MAT_CHANGED, {matType: TQ.MatType.OPUS});
        });
    }


    function doUpdateMat(data) {
        TQ.AssertExt.isNotNull(data.matType, "db必须的参数");
        return $http.post(C_MAN_URL, angular.toJson(data)).then(function (pkg) { // 发出event， 好让dataService等更新自己
            TQUtility.triggerEvent(document, TQ.EVENT.MAT_CHANGED, {matType: data.matType});
        });
    }

    function update(path) {
        TQ.AssertExt.depreciated("是不是无用了？");
        var url = urlConcat(baseUrl, path);
        TQ.Log.debugInfo("update: " + path + " to ==> " + url);
    }

    function del(path) {  // delete is reserved key word!!!
        var url = urlConcat(baseUrl, path);
        TQ.Log.debugInfo("delete: " + url);
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

    function hasFileName(file) {
        return (!!file.name);
    }

    function generateName(blobOrBuffer) {
        var prefix = {
                'audio': '配音',
                'image': '照片'
            },
            dateString = (new Date()).toLocaleString().replace(/[^0-9]/g, '-');

        if (blobOrBuffer.type) {
            var words = blobOrBuffer.type.split('/'),
                type = words[0],
                extension = words[words.length - 1];
        }

        return prefix[type] + dateString + '.' + extension;
    }

    function addTopic(topic) {
        updateTopic(topic);
    }

    function banTopic(topic) {
        topic.ban = true;
        updateTopic(topic);
    }

    function shareTopic(topic) {
        topic.share = true;
        updateTopic(topic);
    }

    function updateTopic(topic) {
        var url = TQ.Config.OPUS_HOST + "/topic";
        if (TQ.State.isAudit) {
            url += "?isAudit=true";
        }
        $http.post(url, JSON.stringify(topic)).then(function (value) {
                console.log(value);
            },
            function (reason) {
                console.log(reason);
            });
    }

    function attachTopic(matType, matId, topicId) {
        doUpdateMatTopic("attachTopic", {
            matType: matType,
            matId: matId,
            topicId: topicId
        });
    }

    function detachTopic(matType, matId, topicId) {
        doUpdateMatTopic("detachTopic", {
            matType: matType,
            matId: matId,
            topicId: topicId
        });
    }

    function doUpdateMatTopic(operation, data) {
        var url = C_MAN_URL + "/" + operation;
        TQ.AssertExt.isNotNull(data.matType, "db必须的参数");
        $http.post(url, JSON.stringify(data)).then(function (value) {
                console.log(value);
                // 发出event， 好让dataService等更新自己
                TQUtility.triggerEvent(document, TQ.EVENT.MAT_CHANGED, {matType: data.matType});
            },
            function (reason) {
                console.log(reason);
            });
    }

    return {
        banMat: banMat, // 先ban， 后 delete, 不要急于删除， 以避免有些作品还在使用它们
        shareMat: shareMat,
        requestToShareMat: requestToShareMat,
        requestToBanMat: requestToBanMat,

        requestToBanOpus: requestToBanOpus,
        banOpus: banOpus, // 先ban， 后 delete, 不要急于删除， 以避免有些作品还在使用它们

        requestToShareOpus: requestToShareOpus,
        refineOpus: refineOpus,
        shareOpus: shareOpus,

        addTopic: addTopic,
        updateTopic: updateTopic,
        attachTopic: attachTopic,
        detachTopic: detachTopic,
        banTopic: banTopic,
        shareTopic: shareTopic,

        initialize: initialize,
        get: get,
        put: put,
        uploadImages: uploadImages,
        uploadOne: uploadOne,
        doUploadImage: doUploadImage,
        update: update,
        del: del
    }
}
