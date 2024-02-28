var TQ = TQ || {};
(function() {
  function CameraService() {
  }
  // take picture/video via camera, and insert it into WCY directly as background
  var _isVideo = false;
  var pcTestImage = "img/camera-emulator.png";

  var takePicture = function(sourceType, onSuccess, onError, imageWidth, imageHeight) {
    if (_isVideo) {
      _takeVideo(sourceType, onSuccess, onError, imageWidth, imageHeight);
    } else {
      _takeStaticImage(sourceType, onSuccess, onError, imageWidth, imageHeight);
    }
  };

  var _takeStaticImage = function(sourceType, onSuccess, onError, imageWidth, imageHeight) {
    if (!TQ.Base.Utility.isCordovaDevice()) {
      TQ.Log.info("isPC!");
    }

    if (!navigator.camera) {
      TQ.Log.info("Camera is not supported, return emulator picture instead");
      onSuccess(pcTestImage);
      return;
    }

    var options = { quality: 50,
      destinationType: Camera.DestinationType.FILE_URI,
      correctOrientation: true,
      // allowEdit : true, // to shrink the image, uncomment these 3 lines
      targetWidth: imageWidth,
      targetHeight: imageHeight,
      saveToPhotoAlbum: false,
      // popoverOptions: CameraPopoverOptions, // ios-only features
      sourceType: sourceType, // 0:Photo Library, 1=Camera, 2=Saved Album
      encodingType: 0 // 0=JPG 1=PNG
    };

    if (enabledBase64()) {
      options.destinationType = Camera.DestinationType.DATA_URL;
    }

    navigator.camera.getPicture(
      function(data) {
        onSuccess(data);
      },
      function(error) {
        // hasImage = false; // probable take more pictures;
        var NORMAL_ACTION = "Camera cancelled";
        if (angular.isString(error) && error.indexOf(NORMAL_ACTION) >= 0) {
          return;
        }

        TQ.Log.eroor("Error in camera call:" + angular.toJson(error));
        if (onError) {
          onError();
        }
      },
      options);

    return false;
  };

  var _takeVideo = function(sourceType, onSuccess, onError) {
    if (!TQ.Base.Utility.isCordovaDevice()) {
      alert("isPC!");
    }

    if (!navigator.camera) {
      alert("Camera is not supported", "Error");
      return;
    }

    // capture callback
    var captureSuccess = function(mediaFiles) {
      var path, len;
      for (let i = 0, len = mediaFiles.length; i < len; i += 1) {
        path = mediaFiles[i].fullPath;
        alert(path);
        // do something interesting with the file
      }

      if (mediaFiles.length > 0) {
        onSuccess(mediaFiles[0].fullPath);
      }
    };

    // capture error callback
    var captureError = function(error) {
      TQ.Log.error("Camera Error: " + error.code);
    };

    // start video capture
    navigator.device.capture.captureVideo(captureSuccess, captureError, { limit: 2 });
  };

  var enabledBase64 = function() {
    return false;
    // return ((!TQ.Base.Utility.isPC()) && (!_isVideo) && TQ.Base.Utility.isFullySupported());
  };

  function insertFromCamera() {
    var sourceType = 1; // 0:Photo Library, 1=Camera, 2=Saved Album
    var imageWidth = 660;
    var imageHeight = 1024;

    function onSuccess(imageUrl) {
      var desc = { src: imageUrl, type: "Bitmap", autoFit: TQ.Element.FitFlag.FULL_SCREEN };
      TQ.SceneEditor.addItem(desc);
    }

    function onError() {

    }
    takePicture(sourceType, onSuccess, onError, imageWidth, imageHeight);
  }

  CameraService.insertFromCamera = insertFromCamera;
  CameraService.takePicture = takePicture;
  CameraService.enabledBase64 = enabledBase64;
  TQ.CameraService = CameraService;
}());
