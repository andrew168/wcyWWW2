/**
 * Created by Andrewz on 12/17/18.
 */

var TQ = TQ || {};
TQ.ImageCliper = (function() {
  var MASK_TYPE_NO = 0;
  var MASK_TYPE_CIRCLE = 1;
  var MASK_TYPE_RECT = 2;

  var canvas;
  var canvasWidth;
  var canvasHeight;
  var widthCompressed;
  var heightCompressed;
  var clipDiv;
  var context;
  var xOffset; var yOffset; // 图像右上角在canvas中的定位. (为了图像居中显示）
  var xc;
  var yc;
  var baseRadius = 100;
  var radius = baseRadius;
  var scale = {
    sx: 1,
    sy: 1
  };
  var resourceReady = true;
  var touchStarted = false;
  var maskType = MASK_TYPE_NO;
  var isCliping = false;
  var onClipCompleted = null;
  var imageObj = new Image();
  var imageFileOrBlob;
  var eleStart = {
    needReset: true,
    xc: 0,
    yc: 0,
    radius: 1,
    scale: { sx: 1, sy: 1 },
    deltaScale: null // 引用的ScaleCalculator尚未 ready
  };
  var mouseStart;
  var clipOps = [
    ["touch", onTouchOrDragStart],
    ["mousedown", onMouseDown],

    ["touchend", onTouchOrDragEnd],
    ["mouseup", onMouseUp],

    ["release", onRelease],
    ["rotate", onPinchAndRotate],
    ["pinch", onPinchAndRotate],

    ["drag", onDrag],
    ["touchmove", notHandled]
  ];

  return {
    clipImage: clipImage,
    setMask: setMask,
    confirm: confirm,
    cancel: cancel
  };

  function setMask(newType) {
    maskType = newType;
  }

  function setClip(x0, y0, scale) {
    switch (maskType) {
      case MASK_TYPE_NO:
        break;
      case MASK_TYPE_CIRCLE:
        drawCircle(x0, y0, scale);
        break;
      case MASK_TYPE_RECT:
        drawRect(x0, y0, scale);
        break;
      default:
        drawCircle(x0, y0, scale);
    }
    if (maskType !== MASK_TYPE_NO) {
      context.clip();
    }
  }

  function drawCircle(x0, y0, scale) {
    if (!scale) {
      scale = { sx: 1, sy: 1 };
    }

    radius = baseRadius * scale.sx;
    context.beginPath();
    context.arc(x0, y0, radius, 0, 2 * Math.PI, false);
    context.stroke();
  }

  function drawRect(xc, yc, scale) {
    if (!scale) {
      scale = { sx: 1, sy: 1 };
    }

    var halfWidth = baseRadius * scale.sx;
    var halfHeight = baseRadius * scale.sy;
    var x0 = xc - halfWidth;
    var x1 = xc + halfWidth;
    var y0 = yc - halfHeight;
    var y1 = yc + halfHeight;

    context.beginPath();
    context.moveTo(x0, y0);
    context.lineTo(x1, y0);
    context.lineTo(x1, y1);
    context.lineTo(x0, y1);
    context.lineTo(x0, y0);
    context.stroke();
  }

  function renderImage() {
    context.drawImage(imageObj, 0, 0, imageObj.width, imageObj.height, xOffset, yOffset, widthCompressed, heightCompressed);
  }

  function clipImage(imageFile, onCompleted) {
    isCliping = true;
    var imageUrl;
    if (!imageFile) {
      imageFile = "/img/welcome-bkg-phone.jpg";
    }

    if (TQUtility.isLocalFile(imageFile)) {
      imageUrl = TQUtility.fileToUrl(imageFile, { crossOrigin: "Anonymous" });
    } else {
      imageUrl = imageFile;
    }
    imageFileOrBlob = imageFile; // File, url, blob
    if (!canvas) {
      canvas = document.getElementById("clipCanvas");
      clipDiv = document.getElementById("clip-div");
      context = canvas.getContext("2d");
      canvas.width = TQ.State.innerWidth;
      canvas.height = TQ.State.innerHeight;
      canvasWidth = canvas.width;
      canvasHeight = canvas.height;
    }
    xc = canvasWidth / 2;
    yc = canvasHeight / 2;
    radius = baseRadius;
    clipDiv.style.display = "block";
    TQ.TouchManager.save();
    TQ.TouchManager.attachOps(clipOps, canvas);

    onClipCompleted = onCompleted;
    resourceReady = false;
    imageObj.src = imageUrl;
    imageObj.onload = function(ev) {
      var minWidth = Math.min(canvasWidth, imageObj.width); var // 不放大， 只缩小
        minHeight = Math.min(canvasHeight, imageObj.height);
      var sx = minWidth / imageObj.width;
      var sy = minHeight / imageObj.height;
      var sxy = Math.min(sx, sy);

      minWidth = sxy * imageObj.width;
      minHeight = sxy * imageObj.height;
      widthCompressed = minWidth;
      heightCompressed = minHeight;
      xOffset = (canvasWidth - widthCompressed) / 2;
      yOffset = (canvasHeight - heightCompressed) / 2;
      xc = xOffset + (widthCompressed / 2);
      yc = yOffset + (heightCompressed / 2);
      scale.sx = Math.min(0.5 * widthCompressed / baseRadius, 0.5 * heightCompressed / baseRadius);
      scale.sy = scale.sx;
      radius = baseRadius;
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
    renderImage();
    /*
	 * restore() restores the canvas context to its original state
	 * before we defined the clipping region
	 */
    context.restore();
  }

  function mainLoop() {
    if (resourceReady) {
      context.clearRect(0, 0, canvas.width, canvas.height);
      doClip(xc, yc, scale);
    }
    if (isCliping) {
      requestAnimationFrame(mainLoop);
    }
  }
  function confirm() {
    if (maskType === MASK_TYPE_NO) {
      return skip();
    }

    setTimeout(getClipResult(function(imageClipedData) {
      var image3Obj = new Image();
      image3Obj.onload = function(ev) {
        // context.drawImage(imageObj, 0, 0);
        // context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image3Obj, 0, 0);
      };
      image3Obj.src = imageClipedData;
    }));
  }

  function skip() {
    // 不clip， 直接把原图返回
    setTimeout(function() {
      if ((imageObj.width > canvasWidth) || (imageObj.height > canvasHeight)) {
        // 图像太大， 必须压缩
        var w = Math.min(canvasWidth, widthCompressed);
        var h = Math.min(canvasHeight, heightCompressed);
        compressImage(imageObj, w, h, complete);
      } else {
        complete(imageFileOrBlob);
      }
    });
  }

  function cancel() {
    setTimeout(function() {
      complete(null);
    });
  }

  function getClipResult(callback) {
    var image1Data = canvas.toDataURL("image/png"); // 默认生成透明图, 带alpha信息, PNG格式的
    var imageObj2 = new Image();
    console.log(image1Data.length);

    function drawClippedResult() {
      var widthClip;
      var heightClip;
      var xs = xc - radius;
      var ys = yc - radius;
      var xe = xc + radius;
      var ye = yc + radius;
      var canvas2 = document.createElement("canvas");
      var ctx;

      // 裁剪出的区域，不能超出图像的边界
      if (xs < xOffset) {
        xs = xOffset;
      }

      if (ys < yOffset) {
        ys = yOffset;
      }

      if (xe > (xOffset + widthCompressed)) {
        xe = xOffset + widthCompressed;
      }

      if (ye > (yOffset + heightCompressed)) {
        ye = yOffset + heightCompressed;
      }
      widthClip = xe - xs;
      heightClip = ye - ys;
      canvas2.width = widthClip;
      canvas2.height = heightClip;
      ctx = canvas2.getContext("2d");
      ctx.drawImage(imageObj2, xs, ys, widthClip, heightClip, 0, 0, widthClip, heightClip);
      setTimeout(function() {
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

  function compressImage(imageObj, destWidth, destHeight, callback) {
    var canvas2 = document.createElement("canvas");
    var ctx;

    canvas2.width = destWidth;
    canvas2.height = destHeight;
    ctx = canvas2.getContext("2d");
    ctx.drawImage(imageObj, 0, 0, imageObj.width, imageObj.height, 0, 0, destWidth, destHeight);
    setTimeout(function() {
      if (callback) {
        callback(canvas2.toDataURL("image/png"));
      }
    });
  }

  function complete(imageData) {
    isCliping = false;
    if (onClipCompleted) {
      if (!imageData) {
        // Canceled
      } else if (imageData instanceof File) { // 对于未clip的原文件
        imageData = TQUtility.fileToUrl(imageData);
      } else if (!TQ.Utility.isImage64(imageData)) {
        TQ.AssertExt.invalidLogic(false, "错误：未知的图像数据!");
      }

      onClipCompleted(imageData);
    }
    TQ.TouchManager.restore();
    clipDiv.style.display = "none";
  }

  function onTouchOrDragStart(e) { // ==mouse的onPressed，
    if (e.type === "mousedown") {
      document.addEventListener("keyup", onKeyUp);
      document.addEventListener("mouseup", onKeyUp);
    }

    TQ.Log.debugInfo("touch start or mousedown" + TQ.Utility.getTouchNumbers(e));
    touchStarted = true;
    updateStartElement(e);
    e.stopPropagation();
    e.preventDefault();
  }

  function onTouchOrDragEnd(e) {
    touchStarted = false;
    if (e.type === "mouseup") {
      document.removeEventListener("keyup", onKeyUp);
      TQ.TouchManager.detachHandler("mousemove", onDrag);
    }

    TQ.Log.debugInfo("touch end, or mouse up " + TQ.Utility.getTouchNumbers(e));
  }

  function updateStartElement(e) {
    resetStartParams(e);
    if (TQ.Utility.isMouseEvent(e)) {
      TQ.TouchManager.attachHandler("mousemove", onDrag);
    }
  }

  function resetStartParams(e) {
    if (!touchStarted) {
      return;
    }
    eleStart.needReset = false;
    eleStart.scale.sx = scale.sx; // 不能用object相等， 那是指针！！！
    eleStart.scale.sy = scale.sy;
    eleStart.xc = xc;
    eleStart.yc = yc;
    if (!eleStart.deltaScale) {
      eleStart.deltaScale = new TQ.ScaleCalculator();
    }
    eleStart.deltaScale.reset();

    var evt = touch2StageXY(e);
    mouseStart = { stageX: evt.stageX, stageY: evt.stageY, firstTime: true };
  }

  function onPinchAndRotate(e) {
    if (!touchStarted) {
      return onTouchOrDragStart(e);
    }
    eleStart.deltaScale.determineScale(null, e);

    if (!isNaN(eleStart.deltaScale.sx) &&
      !isNaN(eleStart.deltaScale.sy) &&
      (Math.abs(eleStart.deltaScale.sx) > 0.00001) &&
      (Math.abs(eleStart.deltaScale.sx) > 0.00001)) {
      doScale(eleStart.deltaScale);
    }
  }

  function doScale(deltaScale) {
    var sx = eleStart.scale.sx * deltaScale.sx;
    var sy = eleStart.scale.sy * deltaScale.sy;
    if ((sx * baseRadius < widthCompressed) || (sy * baseRadius < heightCompressed)) {
      scale.sx = sx;
      scale.sy = sy;
    }
  }

  function onMouseDown(e) {
    return onTouchOrDragStart(e);
  }

  function onMouseUp(e) {
    return onTouchOrDragEnd(e);
  }

  function onRelease() {
  }

  function onDrag(e) { // // ==mouse的onMove，
    if (e.type === "mousemove") {
      return;
    }
    if (!touchStarted) {
      return onTouchOrDragStart(e);
    }

    e = touch2StageXY(e);
    e.stopPropagation();
    e.preventDefault();
    doDrag(mouseStart, e);
  }

  function doDrag(pStart, evt) {
    if (!touchStarted) {
      return onTouchOrDragStart(e);
    }

    xc = eleStart.xc + (evt.stageX - pStart.stageX);
    yc = eleStart.yc + evt.stageY - pStart.stageY;
  }

  function onKeyUp() {
    document.removeEventListener("keyup", onKeyUp);
    document.removeEventListener("mouseup", onKeyUp);
  }

  function touch2StageXY(e) { // 让ionic的 touch 和mouse 兼容createJs格式中部分参数
    var touches = TQ.Utility.getTouches(e);
    if (touches.length > 0) {
      var touch = touches[0];
      e.stageX = touch.pageX;
      e.stageY = touch.pageY;
    } else {
      TQ.AssertExt.invalidLogic(false, "应该有touch点");
    }

    return e;
  }

  function notHandled(e) {
    TQ.Log.debugInfo("event not handled: " + e.type + ", " + (e.touches ? e.touches.length : 0));
  }
}());
