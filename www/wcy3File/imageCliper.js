/**
 * Created by Andrewz on 12/17/18.
 */

var TQ = TQ || {};
TQ.ImageCliper = (function () {
  var canvas,
    clipDiv,
    context,
    xc,
    yc,
    baseRadius = 100,
    radius = baseRadius,
    resourceReady = true,
    onClipCompleted = null,
    imageObj = new Image();

  return {
    clipImage: clipImage,
    confirm: confirm,
    cancel: cancel
  };

  function setClip(x0, y0, scale) {
    drawCircle(x0, y0, scale);
    context.clip();
  }

  function drawCircle(x0, y0, scale) {
    if (!scale) {
      scale = 1;
    }

    radius = baseRadius * scale;
    context.beginPath();
    context.arc(x0, y0, radius, 0, 2 * Math.PI, false);
    context.stroke();
  }

  function drawImage() {
    context.drawImage(imageObj, 0, 0);
  }

  function clipImage(imageUrl, onCompleted) {
    if (!imageUrl) {
      imageUrl = '/img/welcome-bkg-phone.jpg';
    }
    if (!canvas) {
      canvas = document.getElementById('clipCanvas');
      clipDiv = document.getElementById('clip-div');
      context = canvas.getContext('2d');
      xc = canvas.width / 2;
      yc = canvas.height / 2;
    }
    clipDiv.style.display = 'block';

    onClipCompleted = onCompleted;
    resourceReady = false;
    imageObj.src = imageUrl;
    imageObj.onload = function (ev) {
      resourceReady = true;
      mainLoop();
    };
  }

  function doClip(x0, y0, scale) {
    /*
	 * save() allows us to save the canvas context before
	 * defining the clipping region so that we can return
	 * to the default state later on
	 */
    context.save();
    setClip(x0, y0, scale);
    drawImage();
    /*
	 * restore() restores the canvas context to its original state
	 * before we defined the clipping region
	 */
    context.restore();
  }

  function mainLoop() {
    if (resourceReady) {
      context.clearRect(0, 0, canvas.width, canvas.height);
      doClip(xc, yc, 1);
    }
  }
  function confirm() {
    setTimeout(getClipResult(function (imageClipedData) {
      var image3Obj = new Image();
      image3Obj.onload = function (ev) {
        // context.drawImage(imageObj, 0, 0);
        // context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image3Obj, 0, 0);
      };
      image3Obj.src = imageClipedData;
    }));
  }

  function cancel() {
    setTimeout(function () {
      complete(null);
    });
  }

  function getClipResult(callback) {
    var image1Data = canvas.toDataURL("image/png"); // 默认生成透明图, 带alpha信息, PNG格式的
    var imageObj2 = new Image();
    console.log(image1Data.length);

    function drawClippedResult() {
      var widthClip = 2 * radius,
        heightClip = 2 * radius,
        xs = xc - radius,
        ys = yc - radius,
        canvas2 = document.createElement("canvas"),
        ctx;

      canvas2.width = widthClip;
      canvas2.height = heightClip;
      ctx = canvas2.getContext("2d");
      ctx.drawImage(imageObj2, xs, ys, widthClip, heightClip, 0, 0, widthClip, heightClip);
      setTimeout(function () {
        var image2Data = canvas2.toDataURL("image/png");
        console.log(image2Data.length);
        if (callback) {
          callback(image2Data);
        }
        complete(image2Data);
      });
    }

    imageObj2.onload = drawClippedResult;
    imageObj2.src = image1Data;
  }

  function complete(imageData) {
    if (onClipCompleted) {
      onClipCompleted(imageData);
    }
    clipDiv.style.display = 'none';
  }

}());
