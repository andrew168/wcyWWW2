/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 */
TQ = TQ || {};

(function () {
    // 用法: 1) 拖入, 只有声音的 resource 名称,
    //       2) 从scene中读入, 是 JSON
    //  必须是用工厂生产这个元素, 因为, 是数据决定元素的类别.
    function SoundElement(level, jsonObj) {
        assertTrue(TQ.Dictionary.INVALID_PARAMETER, typeof jsonObj !='string'); // 用工厂提前转为JSON OBJ,而且, 填充好Gap
        this.level = level;
        this.children = [];
        this.instance = null;
        this._isNewSkin = false;
        this.isFirstTimePlay = true;
        if (!!jsonObj.t0) { // 记录声音的插入点， 只在插入点开始播放
            this.t0 = jsonObj.t0;
        } else {
            this.t0 = 0;
        }
        this.version = jsonObj.version;
        this.isMultiScene = (this.isVer2plus()) ? true: false;
        this.initialize(jsonObj);
    }

    SoundElement.srcToObj = function(src) {
        return ({type:"SOUND", src: src, isVis:1});
    };
    var p = SoundElement.prototype = new TQ.Element(null, null, null, null);
    p._parent_doShow = p.doShow;
    p.doShow = function(isVisible) {
        this._parent_doShow(isVisible);
        if (isVisible) this.play();
        else this.stop();
    };

    SoundElement.composeResource = function (res) {
        // wav: 都可以用(似乎IE不行）, 已经被FF24.0，CM29.0， SF5.1.7都支持了！！！
        // MP3: IE, CM, SF： ==》 ogg: 火狐, opera
        var currentBrowser = createjs.BrowserDetect;
        var newRes = null;
        if (currentBrowser.isFirefox || currentBrowser.isOpera ) {
            newRes = res.replace("mp3", "ogg");
        } else {
            newRes = res.replace("ogg", "mp3");
        }
        return SoundElement._composeFullPath(newRes);
    };

    // 只允许MP3和ogg, 其余的必须转变
    p._doLoad = function () {
        assertTrue(TQ.Dictionary.INVALID_PARAMETER, this.isSound()); // 只用于声音元素
        if (!TQ.SoundMgr.isSupported) return;
        TQ.Log.info("start to play " + this.jsonObj.src);
        var item = TQ.RM.getResource(this.jsonObj.src);
        if (item) {
            this.loaded = true;
            this.instance = createjs.Sound.createInstance(TQ.RM.getID(item)); // 声音只用ID， 不要resouce data
            //ToDo： 需要在这里play吗？
            //this.instance.play(); //interruptValue, delay, offset, loop);
            // this.setTRSAVZ(); 声音元素， 没有平移、比例、旋转等
            this._afterItemLoaded();
            // this.level.onItemLoaded(this);
        } else {
            (function (pt) {
                TQ.RM.addItem(pt.jsonObj.src, function() {pt._doLoad();});
            })(this);
        }
    };

    p._parent_doAddItemToStage = p._doAddItemToStage;
    p._parent_doRemoveFromStage = p._doRemoveFromStage;
    p._doAddItemToStage = function()   // 子类中定义的同名函数, 会覆盖父类, 让所有的兄弟类, 都有使用此函数.
    {
        if (this.isSound()) {
            TQ.SoundMgr.addItem(this);
        } else {
            this._parent_doAddItemToStage();
        }
    };

    p._parent_calculateLastFrame = p.calculateLastFrame;
    p.calculateLastFrame = function() {
        if (!this.instance) return 0;
        if (this.isMultiScene) return 0;  // ToDo: 需要补改变当前的录制长度， （如：200帧的默认值），跨场景的声音， 不能用来计算本场景的最后一帧
        return (this.t0 + this.instance.duration / 1000);
    };

    SoundElement._composeFullPath = function (res) {
        if (res.indexOf(TQ.Config.SOUNDS_PATH) < 0) {
            return TQ.Config.SOUNDS_PATH + res;
        }

        return res;
    };

    p._doRemoveFromStage = function() {
        if (this.isSound()) {
            if (!this.isMultiScene) { // 支持跨场景的声音
                this.stop();
            }
        } else {
            this._parent_doRemoveFromStage();
        }
    };


    p.play = function () {
        if (!this.instance) {
            assertTrue(TQ.Dictionary.INVALID_LOGIC, false);
            TQ.Log.info(TQ.Dictionary.INVALID_LOGIC + "in SoundElement.resume");
            return;
        }

        if ((!this.visibleTemp)) {
            return; //  不可见； 或者刚才调入， 尚未update生成可见性
        }

        if ((!TQ.FrameCounter.isPlaying() || TQ.FrameCounter.isRequestedToStop())) return;

        if (this.isPlaying()) return;
        if (this.isFirstTimePlay) {
            this.isFirstTimePlay = false;
            if (!this.t0) {
                this.t0 = TQ.FrameCounter.t();   // ToDo:这个t0计算方法有误， 需要根据编辑时插入点的位置， 来计算； 如果播放时，跳开一个位移，则不是播放时的开始位置。
            }
            return this.instance.play();
        }

        if (this.isPaused() || this.isFinished()) { //  在FAILED情况下， 重新开始播放
            var t = TQ.FrameCounter.t();
            if (this.isMultiScene) {
                t = currScene.toGlobalTime(t);
            }
            return this.resume(t);
        }
    };

    // 计算元素插入点的绝对时刻（与当前level无关， 只与元素所在level有关），
    p.toGlobalTime = function(t) {
        return (this.level.getT0() + t);
    };

    // t： 对于简单声音，只是本level中的相对时间；
    //     对于跨场景的声音，是全局时间
    p.resume = function(t) { //
        var ts;
        if (!this.instance) {
            assertTrue(TQ.Dictionary.INVALID_LOGIC, false);
            TQ.Log.info(TQ.Dictionary.INVALID_LOGIC + "in SoundElement.resume");
            return;
        } else {
            if (this.isMultiScene) {
                ts = this.toGlobalTime(this.t0);  // VER2版本引入的跨场景的声音
            } else {
                ts = this.t0;  // 兼容VER1版本中的 单一场景的声音。
            }

            if (this.isFirstTimePlay) {
                this.play();
                return;
            }

            var offset = (t - ts) * 1000;
            var SOUND_DATA_BLOCK_SIZE = 1000;
            if ((offset >= 0) && (offset < Math.max(SOUND_DATA_BLOCK_SIZE, this.instance.duration - SOUND_DATA_BLOCK_SIZE))){
                if (this.instance.paused) { // 被暂停的， 可以resume
                    this.instance.resume();
                    this.instance.setPosition(offset); // 必须是先resume， 在setPosition， 不能对pasued声音设置pos
                } else if (this.instance.playState == createjs.Sound.PLAY_FINISHED) { // 不是paused， 则不能resume， 需要重新开始播放
                    // 声音duration剩余1个block的时候， 已经被标记为播放完成了。
                    // 需要重新建立Instance， 丢弃原来的
                    var item = TQ.RM.getResource(this.jsonObj.src);
                    if (item) {
                        this.instance = createjs.Sound.createInstance(TQ.RM.getID(item)); // 声音只用ID， 不要resouce data
                    }

                    var interrupt = createjs.Sound.INTERRUPT_NONE, delay = 0;
                    this.instance.play(interrupt, delay, offset);
                }
            }
        }
    };

    p.pause = function() {
        var instance = this.instance;
        if (!instance) {
            assertTrue(TQ.Dictionary.INVALID_LOGIC, false);
            return;
        }

        if (!!instance.pause) {
            instance.pause();
        } else if (!!instance.stop) {
            instance.stop();
        } else if (!!instance.setPaused){
            instance.setPaused(true);
        } else {
            TQ.Assert.isTrue(false, "无法pause声音！！");
        }
    };

    p.isPlaying = function() {
        if (!this.instance) {
            assertTrue(TQ.Dictionary.INVALID_LOGIC, false);
            return false;
        }

        var state = this.instance.playState;
        if (!state) return false;
        return !((state == createjs.Sound.PLAY_FINISHED) ||
            (state == createjs.Sound.PLAY_INTERRUPTED) ||
            (state == createjs.Sound.PLAY_FAILED))
    };

    p.isPaused = function() {
        if (!this.instance) {
            return false;
        }

        var state = this.instance.playState;
        if (!state) return false;
        return this.instance.paused;
    };

    p.isFinished = function() {
        if (!this.instance) {
            return false;
        }

        var state = this.instance.playState;
        if (!state) return false;
        return state == createjs.Sound.PLAY_FINISHED;
    };

    p.stop = function () {
        if (!!this.instance) {
            if (this.isPlaying() && (!this.instance.paused)) {
                this.instance.stop();
            }
        }
    };

    p.getAlias = function() {
        var result = "声音";
        if (this.jsonObj && this.jsonObj.alias) {
            result = this.jsonObj.alias;
        }
        return result;
    };

    TQ.SoundElement = SoundElement;
}());
