/**
 * Created by Andrewz on 1/25/2016.
 * 纠正手机照片的Orientation
 * 等比例瘦身到 1024-2048范围，（长边）
 * callback参数：文件的name, data是image64数据
 */
var TQ = TQ || {};

(function(lib){
    function ImageProcess() {
    }

    var _canvas = null;

    function start(file, options, callback) {
        var url = TQUtility.fileToUrl(file, options);
        loadImage.parseMetaData(file, function (data) {
            if (data.exif) {
                options.orientation = data.exif.get('Orientation');
            }
            loadData(url, file.name, options, callback);
        });
    }

    function loadData(url, filename, options, callback) {
        var ele = new Image();
        ele.onload = onload;
        if (!!options.crossOrigin) {
            ele.crossOrigin = options.crossOrigin;
        }
        ele.src = url;

        function determineScale(img) {//只缩小， 不放大，不能超过屏幕的w和h
            var scale = Math.min(1, TQ.Config.designatedHeight / img.height);
            return Math.min(scale, TQ.Config.designatedWidth / img.width);
        }

        function onload () {
            var errorCode = 0;
            if ((ele.width > TQ.Config.designatedWidth)  || (ele.height > TQ.Config.designatedHeight)) {
                errorCode = 1;
            }

            var scale = determineScale(ele),
                ctx,
                neededHeight = Math.round(ele.height * scale / 8) * 8,
                neededWidth = Math.round(ele.width * scale / 8) * 8;

            if (!_canvas) {
                _canvas = document.createElement("canvas");
            }
            _canvas.width = neededWidth;
            _canvas.height = neededHeight;

            ctx = _canvas.getContext("2d");

            if (!!options.orientation) {
                applyOrientation(ctx, _canvas, options);
            }

            var xc = 0, yc =0;
            ctx.drawImage(ele, xc, yc, neededWidth, neededHeight);
            if (callback) {
                callback({errorCode: errorCode, name:filename, data: _canvas.toDataURL("image/png")});
            }
        }
    }

    // helper
    function applyOrientation(ctx, canvas, options) {
        var width = canvas.width,
            height = canvas.height,
            orientation = options.orientation;

        if (!orientation || orientation > 8) {
            return;
        }
        if (orientation > 4) {
            canvas.width = height;
            canvas.height = width;
        }
        switch (orientation) {
            case 2:
                // horizontal flip
                ctx.translate(width, 0);
                ctx.scale(-1, 1);
                break;
            case 3:
                // 180° rotate left
                ctx.translate(width, height);
                ctx.rotate(Math.PI);
                break;
            case 4:
                // vertical flip
                ctx.translate(0, height);
                ctx.scale(1, -1);
                break;
            case 5:
                // vertical flip + 90 rotate right
                ctx.rotate(0.5 * Math.PI);
                ctx.scale(1, -1);
                break;
            case 6:
                // 90° rotate right
                ctx.rotate(0.5 * Math.PI);
                ctx.translate(0, -height);
                break;
            case 7:
                // horizontal flip + 90 rotate right
                ctx.rotate(0.5 * Math.PI);
                ctx.translate(width, -height);
                ctx.scale(-1, 1);
                break;
            case 8:
                // 90° rotate left
                ctx.rotate(-0.5 * Math.PI);
                ctx.translate(-width, 0);
                break;
        }
    }

    ImageProcess.start = start;
    lib.ImageProcess = ImageProcess;
})(TQ);
