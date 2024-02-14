/**
 * Created by Andrewz on 5/11/19.
 */
angular.module("starter").factory("StorageManager", StorageManager);
StorageManager.$inject = ["$q", "$timeout", "$http", "NetService"];

function StorageManager($q, $timeout, $http, NetService) {
  var cachedQueue = [];
  var isUploading = false;
  var onReadyForCloseCallback = null;

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
    cachedQueue.push({ wcyId: TQ.Scene.getWcyId(),
      localId: TQ.Scene.getLocalId(),
      ssSign: TQ.Scene.getSsSign(),
      opusJson: opusJson,
      screenshot: screenshot,
      onSuccess: onSuccess });

    setTimeout(function() {
      startUpload();
    });
  }

  function saveOpus(opusJson, options, onSuccess, onError) {
    cachedQueue.push({ wcyId: TQ.Scene.getWcyId(),
      localId: TQ.Scene.getLocalId(),
      opusJson: opusJson,
      options: options,
      onSuccess: onSuccess,
      onError: onError });

    setTimeout(function() {
      startUpload();
    });
  }

  function saveScreenshot(screenshot, onSuccess, onError) {
    cachedQueue.push({ wcyId: TQ.Scene.getWcyId(),
      localId: TQ.Scene.getLocalId(),
      ssSign: TQ.Scene.getSsSign(),
      screenshot: screenshot,
      onSuccess: onSuccess,
      onError: onError });

    setTimeout(function() {
      startUpload();
    });
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
      console.log("upload " + onePackage.wcyId + ", " + onePackage.length);

      /*
      // if no wcyId , apply wcyId, shared = true
      // if screenshot, upload screenshot
      // update currScene： ssPath,
      save record,  shared = true
       */

      if (!onePackage.ssSign) {
        uploadOpus(onePackage.wcyId, onePackage.opusJson, onePackage.options).then(
          function(httpResult) {
            httpResult.localIdCached = onePackage.localId;
            TQ.Scene.parseOpusSaveResult(httpResult.data);
            if (onePackage.onSuccess) {
              onePackage.onSuccess(httpResult);
              if (!onePackage.ssSign) {
                onePackage.ssSign = TQ.Scene.getSsSign();
              }
              if (!TQ.Utility.isValidWcyId(onePackage.wcyId)) {
                onePackage.wcyId = TQ.Scene.getWcyId();
              }

              if (onePackage.screenshot) {
                uploadWithSsign();
              } else {
                onUploadCompleted(httpResult);
              }
            }
          }
        ).then(function(value) {
          console.log("saved successfully!");
        }, _onNetIOError);
      } else {
        uploadWithSsign();
      }

      function uploadWithSsign() {
        if (onePackage.screenshot) {
          uploadScreenshot(onePackage.ssSign, onePackage.screenshot)
            .then(doSaveOpus, _onNetIOError)
            .catch(_onNetIOError);
        } else {
          doSaveOpus();
        }
      }

      function doSaveOpus(value) {
        if (onePackage.opusJson) {
          console.log(value);
          TQ.Scene.updateSSPath(onePackage, currScene.ssPath);
          uploadOpus(onePackage.wcyId, onePackage.opusJson, onePackage.options)
            .then(onUploadCompleted, _onNetIOError);
        } else {
          onUploadCompleted({});
        }
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
  function uploadOpus(_wcyId, jsonWcyData, options) {
    if (!TQ.Utility.isValidWcyId(_wcyId)) {
      _wcyId = 0;
    }

    var params = "?wcyId=" + _wcyId;
    var forkIt = (!!options && !!options.forkIt);

    return $http({
      method: "POST",
      url: TQ.Config.OPUS_HOST + "/wcy" + params + (forkIt ? "&fork=true" : ""),
      headers: {
        "Content-Type": "application/json"
      },
      data: jsonWcyData
    });
  }

  function uploadScreenshot(ssSign, screenshot) {
    TQ.AssertExt.invalidLogic(!!ssSign);
    TQ.AssertExt.invalidLogic(!!screenshot);
    if (!ssSign) {
      throw new Error("internal error: no ssSign");
    }

    return NetService.doUploadImage(ssSign, screenshot).then(onUploadSsSuccess);
  }

  function onUploadSsSuccess(res) {
    var data = (!res) ? null : res.data;
    if (data) {
      if (data.url) {
        currScene.setSsPath(data.url);
        // TQ.MessageBox.toast(TQ.Locale.getStr('screenshot uploaded successfully!'));
        // save();
      }

      TQ.Log.debugInfo(data);
    }
  }

  function _onNetIOError(data) {
    TQ.Log.debugInfo(data);
    TQ.MessageBox.confirm(TQ.Locale.getStr("hey, the network connection lost"));
  }

  return {
    HTTP_RES_STATUS_OK: "OK",
    isReadyForClose: isReadyForClose,
    onReadyForClose: onReadyForClose,
    saveAll: saveAll,
    saveOpus: saveOpus,
    saveScreenshot: saveScreenshot
  };
}
