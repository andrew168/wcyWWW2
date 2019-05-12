/**
 * Created by Andrewz on 5/11/19.
 */
angular.module('starter').factory("StorageManager", StorageManager);
StorageManager.$inject = ['$q', '$timeout', '$http', 'NetService'];

function StorageManager($q, $timeout, $http, NetService) {
  var cachedQueue = [],
    isUploading = false,
    onReadyForCloseCallback = null;

  function isReadyForClose() {
    return !(isUploading || cachedQueue.length > 0);
  }

  function onReadyForClose(callback) {
    if (isReadyForClose()) {
      callback();
    } else {
      onReadyForCloseCallback = callback;
    }
  }

  function saveAll(opusJson, screenshot, onSuccess) {
    cachedQueue.push({wcyId: TQ.Scene.getWcyId(),
      localId: TQ.Scene.getLocalId(),
      ssSign: currScene.ssSign,
      opusJson: opusJson,
      screenshot: screenshot,
      onSuccess: onSuccess});

    setTimeout(function () {
      startUpload();
    })
  }

  function saveOpus(opusJson, options, onSuccess, onError) {
    cachedQueue.push({wcyId: TQ.Scene.getWcyId(),
      localId: TQ.Scene.getLocalId(),
      opusJson: opusJson,
      options: options,
      onSuccess: onSuccess,
      onError: onError});

    setTimeout(function () {
      startUpload();
    })
  }

  function saveScreenshot(screenshot, onSuccess, onError) {
    cachedQueue.push({wcyId: TQ.Scene.getWcyId(),
      localId: TQ.Scene.getLocalId(),
      ssSign: currScene.ssSign,
      screenshot: screenshot,
      onSuccess: onSuccess,
      onError: onError});

    setTimeout(function () {
      startUpload();
    })
  }

  function startUpload() {
    if (cachedQueue.length <= 0) {
      return;
    }
    var onePackage = cachedQueue.pop();
    if (onePackage) {
      isUploading = true;
      if (!onePackage.opusJson) {
        console.log("screenshot only");
      }
      console.log('upload ' + onePackage.wcyId + ', ' + onePackage.length);

      /*
      // if no wcyId , apply wcyId, shared = true
      // if screenshot, upload screenshot
      // update currScene： ssPath,
      save record,  shared = true
       */

      if (onePackage.screenshot) {
        uploadScreenshot(onePackage.ssSign, onePackage.screenshot).then(doSaveOpus);
      } else {
        doSaveOpus();
      }

      function doSaveOpus(value) {
        if (onePackage.opusJson) {
          console.log(value);
          var newPath = currScene.ssPath;
          var tempJson = JSON.parse(onePackage.opusJson);
          tempJson.ssPath = newPath;
          onePackage.opusJson = JSON.stringify(tempJson);
          uploadOpus(onePackage.wcyId, onePackage.opusJson, onePackage.options).then(onUploadCompleted);
        } else {
          onUploadCompleted({});
        }

        function onUploadCompleted(httpResult) {
          httpResult.localIdCached = onePackage.localId;
          isUploading = false;
          if (onePackage.onSuccess) {
            onePackage.onSuccess(httpResult);
          }
          if (isReadyForClose() && onReadyForCloseCallback) {
            onReadyForCloseCallback(httpResult);
          }
        }
      }
    }
  }
  function uploadOpus(_wcyId, jsonWcyData, options) {
    var params = '?wcyId=' + _wcyId,
      forkIt = (!!options && !!options.forkIt);

    return $http({
      method: 'POST',
      url: TQ.Config.OPUS_HOST + '/wcy' + params + (forkIt ? "&fork=true" : ""),
      headers: {
        'Content-Type': 'application/json'
      },
      data: jsonWcyData
    });
  }

  function uploadScreenshot(ssSign, screenshot) {
    var q = $q.defer();
    if (!ssSign) {
      setTimeout(function () {
        q.reject({errMsg: "failed to uploadScreen: !ssSign ", data: null});
      });
    } else {
      TQ.AssertExt.invalidLogic(!!ssSign);
      TQ.AssertExt.invalidLogic(!!screenshot);
      NetService.doUploadImage(ssSign, screenshot).then(
        function (res) {
          onUploadSsSuccess(res);
          q.resolve(res);
        }, function (err) {
          onErrorGeneral(err);
          q.reject(err);
        });
    }

    return q.promise;
  }

  function onUploadSsSuccess(res) {
    var data = (!res) ? null : res.data;
    if (!!data) {
      if (!!data.url) {
        currScene.setSsPath(data.url);
        // TQ.MessageBox.toast(TQ.Locale.getStr('screenshot uploaded successfully!'));
        // save();
      }

      TQ.Log.debugInfo(data);
    }
  }

  return {
    isReadyForClose: isReadyForClose,
    onReadyForClose: onReadyForClose,
    saveAll: saveAll,
    saveOpus: saveOpus,
    saveScreenshot: saveScreenshot
  }
}
