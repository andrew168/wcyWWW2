/*
 ImagePreloader: 采用HTML的src参数来load， 应该支持各种文件，包括：
    * 远程服务器文件，
    * app本地文件，
    * cache中的文件，等等
 在RM中用于调用image。
 */
    (function() {

        function ImagePreloader(item) {
            this.AbstractLoader_constructor(item, false, "loader");
            this.img = null;
        }

        // Static Plugin Methods
        ImagePreloader.getPreloadHandlers = function() {
            return {
                types: ["image"],
                callback: ImagePreloader.preloadHandler
            };
        };
        ImagePreloader.preloadHandler = function(loadItem) {
            var loader = new ImagePreloader(loadItem);
            loader.on("complete", ImagePreloader.handleComplete, ImagePreloader);
            return loader;
        };
        ImagePreloader.handleComplete = function(event) {
            var img = event.result;
            img.width = img.height = 200;
        };

        // Loader Methods
        var p = createjs.extend(ImagePreloader, createjs.AbstractLoader);

        p.load = function() {
            this.img = new Image();
            if (this._item.crossOrigin) {  // _item is defined by preloaderJS
                this.img.crossOrigin="anonymous";
            }
            this.img.crossOrigin="anonymous";
            this.img.onload = createjs.proxy(this.handleLoad, this);
            this.img.src = this._item.src;
        };
        p.handleLoad = function() {
            this._result = this.img;
            this._sendComplete();
        };
        window.ImagePreloader = createjs.promote(ImagePreloader, "AbstractLoader");

    }());


function init111() {
    if (window.top != window) {
        document.getElementById("header").style.display = "none";
    }

    var loader = new createjs.LoadQueue();
    loader.installPlugin(ImagePreloader);
    loader.loadFile("../_assets/art/Autumn.png")
    loader.on("fileload", handleFileLoad);
    loader.load();
}

function handleFileLoad2222(event) {
    TQ.Log.debugInfo(event);
    document.body.appendChild(event.result);
}
