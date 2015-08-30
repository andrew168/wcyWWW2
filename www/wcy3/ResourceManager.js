/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 */
this.TQ = this.TQ || {};

(function () {
    // ToDo: RM内部只保存相对路径， 外部使用全路径。
    //      内部全部使用fullPath， 只有在保存文件的时候， 才使用相对路径， 既便于移植到不同的环节， 又能够唯一化代码
    // ToDo: 避免重复加入到Queue中，在addItem的时候， 如果已经在Queue中， 也不要加入，只处理其callback，
    // ToDo: 处理错误， 如果文件不存在， 则用"NoSound.wav" 或者“NoRes.png" 来替代。并执行其callback
    // ToDo: 加引用次数, 在内存不足的时候， 释放没有引用的资源
    // 资源管理器设计目标：
    //  * 预先加载资源，画面更流程，
    //  * 唯一化ID，避免重复加载:
    //  ** 一个资源，只加载1次，多次使用，在多个位置，多个角度
    //  ** 已经加载的资源， 用ID获取内容， 直接使用；
    //  ** 未加载的资源， 支持一对一的回调
    //  * 第一个Level加载完成之后， 马上开始播放该level， 同时， 继续加载后续的Level
    //  ** 如果当前Level加载没有完成， 则显示等待画面；
    //
    // 结构设计：
    // 1）level的资源， 及其回调函数（设置：dataReady）
    // 2）逐个加载每一个level，并且调用其回调函数，
    //
    // 已知的问题：
    //  1) preloadJS中的XHLLoader 会两次通过network加载同一资源， 只是第二次总是从cache中获取（从谷歌调试的network页面中看到）。
    //
    //

    function ResourceManager() {
    }

    var RM = ResourceManager;
    var FAST_SERVER = "http://bone.udoido.cn";
    // var FAST_SERVER = "http://www.udoido.com";
    RM.NOSOUND = "/mcSounds/p1.wav";
    RM.NOPIC = "/mcImages/p1.png";
    RM.BASE_PATH = null;
    RM.isEmpty = true;
    RM.items = [];
    RM.preloader = {};
    RM.callbackList = [];
    RM.dataReady = false;
    RM.completeOnceHandlers = [];
    RM.initialize = function() {
        if (!!RM._hasCreated) { // 确保只创建一次
            return;
        }

        RM._hasCreated = true;
        RM.hasDefaultResource = false;
        // RM.BASE_PATH = "http://" + TQ.Config.DOMAIN_NAME;
        RM.BASE_PATH = FAST_SERVER;
        RM.NOPIC = RM.toFullPath(RM.NOPIC);
        RM.NOSOUND = RM.toFullPath(RM.NOSOUND);
        createjs.FlashPlugin.swfPath = "../src/soundjs/"; // Initialize the base path from this document to the Flash Plugin
        if (createjs.Sound.BrowserDetect.isChrome ||  // Chrome, Safari, IOS移动版 都支持MP3
            createjs.Sound.BrowserDetect.isIOS) {
            createjs.Sound.registerPlugins([createjs.WebAudioPlugin, createjs.HTMLAudioPlugin, createjs.FlashPlugin]);
        } else { // Firefox只在vista以上OS中支持MP3，且自动加载MP3尚未实现， 所以用flash
            createjs.Sound.registerPlugins([createjs.WebAudioPlugin, createjs.HTMLAudioPlugin, createjs.FlashPlugin]);

//            createjs.Sound.registerPlugins([createjs.FlashPlugin, createjs.WebAudioPlugin, createjs.HTMLAudioPlugin]); // need this so it doesn't default to Web Audio
            // 在Firefox下， 如果只加Flash声音， 则 无法预先加载WAV
        }

		// Instantiate a queue.
        RM.preloader = new createjs.LoadQueue(true); // , "assets/");
        RM.preloader.installPlugin(createjs.Sound);
        RM.setupListeners();
    };

    RM.setupDefaultResource = function() {
        RM.hasDefaultResource = true;
        RM.addItem(RM.NOPIC);
        RM.addItem(RM.NOSOUND);
    };

    RM.setupListeners = function() {
        //Available PreloadJS callbacks
        RM.preloader.on("fileload", function(event) {
            var resID = event.item.id;
            var result = event.result;
            //ToDo: 唯一化断言
            RM.items[resID].res = result;
            RM.items[resID].type = event.item.type;
            console.log(event.toString() +": " + event.item.id);
            RM.onFileLoad(resID, result, event);
        });

        RM.preloader.addEventListener("complete",  function(event) {
            console.log(event.toString());
            RM.dataReady = true;
            var num = RM.completeOnceHandlers.length; // 防止动态添加的函数
            for (; num > 0; num --) {
                var handler = RM.completeOnceHandlers.shift();
                handler(event);
            }
            RM.isEmpty = true;
        });

        RM.preloader.addEventListener("error",  function(event) {
            console.log(event.item.src + ": " + event.toString() );
            var resID = event.item.id;
            var result = null;
            var altResID = null;

            switch (event.item.type) {
                case createjs.LoadQueue.IMAGE:
                    altResID = RM.toFullPath(RM.NOPIC);
                    break;

                case createjs.LoadQueue.SOUND:
                    altResID = RM.toFullPath(RM.NOSOUND);
                    break;

                case createjs.LoadQueue.TEXT: // 元件的文件
                    break;

                default :
                    console.log(event.item.type +": 未处理的资源类型!");
            }

            if ((altResID != null) && (!!RM.items[altResID])) {
                result = RM.items[altResID].res;
            } else {
                assertTrue(TQ.Dictionary.INVALID_LOGIC, false);
            }

            RM.items[resID] = { ID: resID, res:result, type:event.item.type};
            if (result == null) {
                RM.addItem(altResID, function() {
                    RM.items[resID].res = RM.items[altResID].res;
                    RM.items[resID].altResID = RM.items[altResID].ID;
                });

                assertTrue(TQ.Dictionary.INVALID_LOGIC, false);
            } else {
                RM.items[resID].altResID = RM.items[altResID].ID;
                RM.onFileLoad(resID, result, null);
            }
        });

        RM.preloader.addEventListener("progress",  function(event) {
            // console.log("." + event.toString() + ": " + event.loaded);
        });
        RM.dataReady = false;
    };

    RM.onFileLoad = function(resID, result, event) {
        //check for callback
        for (var i = 0; i < RM.callbackList.length; i++) {
            if (RM.callbackList[i].ID == resID) {
                console.log("find immediate call back to do");
                var item = RM.callbackList.splice(i, 1);
                item[0].func(event);
                i--;
            }
        }
    };

    RM.getID = function(item) {
        if (!item.altResID) {
            return item.ID;
        } else {
            return item.altResID;
        }
    };

    // 清除所有的资源，准备开始新的微创意
    RM.reset = function() {
        RM.completeOnceHandlers.splice(0);
        RM.preloader.removeAllEventListeners();
        RM.preloader.reset();
        RM.preloader.removeAll();
        RM.setupListeners();
        RM.isEmpry = true;
    };

    // 信号：暂停预加载，以便于处理时间敏感的判定， 必须是短时间
    RM.setPaused = function(value)
    {
        RM.preloader.setPaused(value);
    };

    // 完成加载的顺序与开始加载顺序无关。 最先开始加载的资源， 如果很大，最后才加载完成。 如果后开始加载的资源下。
    // 只有遍历
    RM.on = function(eventName, callback) {
        RM.preloader.addEventListener(eventName,  callback);
    };

    RM.onCompleteOnce = function(callback) {
        RM.completeOnceHandlers.push(callback);
    };

    RM.removeEventListener = function(eventName, callback) {
        RM.preloader.removeEventListener(eventName,  callback);
    };

    function _addReference(resourceID) {

    }
    RM.addItem = function(resourceID, _callback) {
        if (!RM.hasDefaultResource) {
            RM.setupDefaultResource();
        }
        resourceID = RM.toFullPath(resourceID);
        if (this.hasResource(resourceID)) {
          _addReference(resourceID);
          return;
        }

        // 添加Item 到预加载队列中， 并启动运行预加载（如果没有运行的话）
        //ToDo: RM.Items.push({});
        RM.items[resourceID] = { ID: resourceID, res:null, type:null};

        if (!!_callback) {
            RM.callbackList.push({ID:resourceID, func:_callback});
        }

        // RM.preloader.loadFile("assets/image0.jpg");
        RM.dataReady = false;
         RM.preloader.loadManifest([{
            src : resourceID,
            id : resourceID,   // Sound资源的id是字符串, 不是数字
            data : 3  // 本资源最大允许同时播放N=3个instance。（主要是针对声音）
        }]);

        RM.isEmpty = false;
    };

    /*
     如果成功地送到RM， 则返回true；对于有多个资源的情况，只有送入1个就返回true。
     如果没有送入RM， （比如:RM中已经有了）， 则 返回false
     */
    RM.addElementDesc = function(desc, callback) {
        if (!desc) return false;

        var result  = false;
        if (!!desc.children) {  // 先调入子孙的资源， 以便于执行callback
            for (var i = 0; i < desc.children.length; i++) {
                if (RM.addElementDesc(desc.children[i])) {
                    result = true;
                }
            }
        }

        //
        if (desc.type === "Group") {
            return result;
        }

        if (!!desc.src) {  // 处理自己的资源
            var resName = RM.toRelative(desc.src);
            resName.trim();
            if (resName.length > 0) {
                if (!RM.hasResource(resName)) {
                    RM.addItem(resName, callback);
                    result = true;
                } else if (!!callback) {
                    callback();
                }
            }
        }

        return result;
    };

    /*
     只要差一个资源未调入RM， 都必须返回false，
     */
    RM.hasElementDesc = function(desc) {
        if (!desc) return true;
        var result = true;

        if (!!desc.children) {  // 先调入子孙的资源， 以便于执行callback
            for (var i = 0; i < desc.children.length; i++) {
                if (RM.addElementDesc(desc.children[i])) {
                    result = false;
                }
            }
        }

        if (!!desc.src) {  // 处理自己的资源
            var resName = RM.toRelative(desc.src);
            resName.trim();
            if (resName.length > 0) {
                if (!RM.hasResource(resName)) result = false;
            }
        }

        return result;
    };

    RM.hasResource = function(id) {
        return !(!RM.items[RM.toFullPath(id)]);
    };

    RM.getResource = function(id) {
        id = RM.toFullPath(id);
        if (!RM.items[id]) {// 没有发现， 需要调入
            console.log(id + ": 没有此资源, 需要加载, 如果需要回调函数，用 addItem 替代 getResource");
            // 添加到预加载列表中
            // 设置回调函数
            return null;
        }

        return RM.items[id];
    };

    var stage;
    var canvas;

    var bar;
    var loaderWidth = 300;

    // bar
    function barInitialize() {

        var x0 = canvas.width - loaderWidth>>1;
        var y0 = canvas.height - barHeight>>1;
        var barHeight = 20;

        var loaderColor = createjs.Graphics.getRGB(247,247,247);
        var loaderBar = new createjs.Container();

        bar = new createjs.Shape();
        bar.graphics.beginFill(loaderColor).drawRect(0, 0, 1, barHeight).endFill();

        var bgBar = new createjs.Shape();
        var padding = 3;
        bgBar.graphics.setStrokeStyle(1).beginStroke(loaderColor).drawRect(-padding/2, -padding/2, loaderWidth+padding, barHeight+padding);
        loaderBar.x = x0;
        loaderBar.y = y0;
        loaderBar.addChild(bar, bgBar);
        stage.addChild(loaderBar);
    }

    function handleProgress(event) {
        console.log(event.loaded);
        // bar.scaleX = event.loaded * loaderWidth;
    }

    RM.toRelative = function(str) {
        var newStr = str.replace("http://" + TQ.Config.DOMAIN_NAME + "/", "");

        // 防止此前旧文件中存在的其它域名
        newStr = newStr.replace("http://", "");
        newStr = newStr.replace("test.udoido.cn", "");
        newStr = newStr.replace("www.udoido.cn", "");
        return newStr;
    };

    RM._isFullPath = function(name) {
        return (name.indexOf(RM.BASE_PATH) >= 0);
    };

    RM.toFullPath = function(name) {
        if (RM._isFullPath(name)) {
            return name;
        }

        if (name[0] =='/') {
            return (RM.BASE_PATH + name);
        }

        return (RM.BASE_PATH + "/" + name);
    };

    TQ.RM = RM;
    TQ.ResourceManager = RM;
}());
