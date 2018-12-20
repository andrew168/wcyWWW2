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
    isCliping = false,
    onClipCompleted = null,
    imageObj = new Image(),
    eleStart = {
      needReset: true,
      xc: 0,
      yc: 0,
      radius: 1,
      scale: {sx: 1, sy: 1}
    },
    deltaTrsa = {
      dx: 0,
      dy: 0,
      scale: {sx: 1, sy: 1}
    },
    mouseStart,

    clipOps = [
      ['touch', onTouchOrDragStart],
      ['mousedown', onMouseDown],

      ['touchend', onTouchOrDragEnd],
      ['mouseup', onMouseUp],

      ['release', onRelease],
      ['rotate', onPinchAndRotate],
      ['pinch', onPinchAndRotate],

      ['drag', onDrag],
      ['touchmove', notHandled]
    ];

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
    isCliping = true;
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
    TQ.TouchManager.save();
    TQ.TouchManager.attachOps(clipOps, canvas);

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
    if (isCliping) {
      requestAnimationFrame(mainLoop);
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
    isCliping = false;
    if (onClipCompleted) {
      onClipCompleted(imageData);
    }
    TQ.TouchManager.restore();
    clipDiv.style.display = 'none';
  }

  function onTouchOrDragStart(e) { // ==mouse的onPressed，
    if (e.type === 'mousedown') {
      document.addEventListener('keyup', onKeyUp);
      document.addEventListener('mouseup', onKeyUp);
    }

    TQ.Log.debugInfo("touch start or mousedown" + TQ.Utility.getTouchNumbers(e));
    updateStartElement(e);
    e.stopPropagation();
    e.preventDefault();
  }

  function onTouchOrDragEnd(e) {
    if (e.type === 'mouseup') {
      document.removeEventListener('keyup', onKeyUp);
      TQ.TouchManager.detachHandler('mousemove', onDrag);
    }

    TQ.Log.debugInfo("touch end, or mouse up " + TQ.Utility.getTouchNumbers(e));
  }

  function updateStartElement(e) {
    resetStartParams(e);
    if (TQ.Utility.isMouseEvent(e)) {
      TQ.TouchManager.attachHandler('mousemove', onDrag);
    }
  }

  function resetStartParams(e) {
    eleStart.needReset = false;
    eleStart.scale = 1;
    eleStart.xc = xc;
    eleStart.yc = yc;
    eleStart.radius = radius;

    var evt = touch2StageXY(e);
    mouseStart = {stageX: evt.stageX, stageY: evt.stageY, firstTime: true};
    deltaTrsa.scale.reset();
  }

  function onPinchAndRotate(e) {
    var scale;
    if (e.type.indexOf('pinch') >= 0) {
      scale = e.gesture.scale;
    }
    var newScaleX = eleStart.scale.sx * scale,
      newScaleY = eleStart.scale.sy * scale;
    if (!isNaN(newScaleX)) {
      if (Math.abs(newScaleX) < 0.00001) {
        console.warn("Too small");
      } else {
        doScale({sx: newScaleX, sy: newScaleY});
      }
    }
  }

  function doScale(scale) {
    radius = eleStart.radius * scale.sx;
  }

  function onMouseDown(e) {
    return onTouchOrDragStart(e);
  }

  function onMouseUp(e) {
    return onTouchOrDragEnd(e);
  }

  function onRelease() {
  }

  function onDrag(e) {  //// ==mouse的onMove，
    if (e.type === 'mousemove') {
      return;
    }

    e = touch2StageXY(e);
    e.stopPropagation();
    e.preventDefault();
    doDrag(mouseStart, e);
  }

  function doDrag(pStart, evt) {
    xc += evt.stageX - pStart.stageX;
    yc += evt.stageY - pStart.stageY;
  }

  function onKeyUp() {
    document.removeEventListener('keyup', onKeyUp);
    document.removeEventListener('mouseup', onKeyUp);
  }

  function touch2StageXY(e) { //让ionic的 touch 和mouse 兼容createJs格式中部分参数
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
