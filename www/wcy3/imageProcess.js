/**
 * Created by Andrewz on 1/25/2016.
 */
var TQ = TQ || {};

// 是否纠正Orientation
// 等比例瘦身到 1024-2048范围，（长边）

(function(lib){
    function ImageProcess() {

    }
    var p = ImageProcess.prototype;
    var _canvas = null;

    var urlAPI = (window.createObjectURL && window) ||
        (window.URL && URL.revokeObjectURL && URL) ||
        (window.webkitURL && webkitURL);

    p.start = function(file, options, callback) {
        var url = p.toUrl(file, options);
        loadImage.parseMetaData(file, function (data) {
            if (data.exif) {
                options.orientation = data.exif.get('Orientation');
            }
            p.loadData(url, options, callback);
        });
    };

    p.toUrl = function(file, options) {
        // convert blob, local file, to  url
        var url, oUrl;
        if (_isInstanceOf('Blob', file) ||
            _isInstanceOf('File', file)) {
            // Files are also Blob instances, but some browsers
            // (Firefox 3.6) support the File API but not Blobs:

            url = oUrl = _createObjectURL(file);
            // Store the file type for resize processing:
            options._type = file.type;
        } else if (typeof file === 'string') {
            url = file;
            if (options && options.crossOrigin) {
                // img.crossOrigin = options.crossOrigin;
            }
        } else {
            TQ.Log.error("未知的文件信息");
            url = file;
        }

        return url;
    };

    p.loadData = function (url, options, callback) {
        var ele = new Image();
        function onload () {
            var ctx, neededHeight, neededWidth;
            neededHeight = ele.height;
            neededWidth = ele.width;
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
            ctx.drawImage(ele, xc, yc);
            if (callback) {
                callback(_canvas.toDataURL("image/jpeg"));
            }
        }

        ele.onload = onload;
        if (!!options.crossOrigin) {
            ele.crossOrigin = options.crossOrigin;
        }
        ele.src = url;
    };

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

    function _isInstanceOf(type, obj) {
        // Cross-frame instanceof check
        return Object.prototype.toString.call(obj) === '[object ' + type + ']';
    }

    function _createObjectURL (file) {
        return urlAPI ? urlAPI.createObjectURL(file) : false;
    }

    lib.ImageProcess = ImageProcess;
})(TQ);
