/**
 * 图强动漫引擎, 专利产品, 让生活动漫起来.
 * 强大的创意动力源泉
 * 微创意拍摄和播放专用的Timer,(实际上在内部就是 Framer Counter, 对外,为了用户方便, 按照当前FPS转为时间),
 * FrameCounter记录实际拍摄的时刻(帧编号), 而不是日历时长. 时间轴的0点在片头, 终点在片尾..
 * 例如: 假设每秒20帧: FPS = 20; i.e. 一帧的对应1/20 秒, == 0.05秒.
 * 片子的第一个画面(帧): FrameCounter =0, 第二个画面(帧): FrameCounter = 1, 或0.05秒, 依次类推,
 * 第100帧, FrameCounter = 100, 或5秒.
 * 在一个Scene内如此,
 * 在一个Level内部,也如此. Level 1里面有Frame 0, Level 2 里面也有. 各是各的.
 */

window.TQ = window.TQ || {};

(function (){
    function FrameCounter()
    {
        assertNotHere(TQ.Dictionary.INVALID_LOGIC); // Singleton, 禁止调用
    }

    // ToDo:
    FrameCounter.GO = 1; // 调在使用之前, 常量在使用之前必须先定义(包括初始化,例如下面给_state赋值)
    FrameCounter.STOP = 0;
    FrameCounter.isNew = true;  // 新的时刻, 需要更新数据
    FrameCounter.v = 0;
    FrameCounter.defaultFPS = 20;
    FrameCounter.max = 120 * FrameCounter.defaultFPS; // 空白带子, 长度为 30秒 * 每秒20帧,  600
    FrameCounter._FPS = FrameCounter.defaultFPS;  // 下划线是内部变量, 禁止外面引用
    FrameCounter.BASE_STEP = 1;
    FrameCounter._step = FrameCounter.BASE_STEP;
    FrameCounter._state = (TQ.Config.AutoPlay ? FrameCounter.GO : FrameCounter.STOP);
    FrameCounter._requestState = null;
    FrameCounter._autoRewind = false;
    FrameCounter._level = null;

    /*  FrameCounter 是一个控制器, 不是存储器, 所以它不保留任何值,
     * 也不复制这些值, 以避免数据的不一致.
     * 而Level是存储器, (也可能带有执行器的功能, 复合型的), 保有 FPS, fileLength等值.
     * */
    FrameCounter.initialize = function (t0, FPS, level) {
        //ToDo: 要 最大长度吗? 要, 而且是当前level的实实在在的max
        assertNotNull(TQ.Dictionary.FoundNull, t0); //必须强制调用者遵从, 以简化程序,  因为此部分与用户的任意性无关
        assertNotNull(TQ.Dictionary.FoundNull, FPS);
        assertNotNull(TQ.Dictionary.FoundNull, level);
        FrameCounter.v = t0 * FPS;
        FrameCounter._FPS = FPS;
        FrameCounter._level = level;
        FrameCounter.max = level.getTime();
        TQ.InputMap.registerAction(TQ.InputMap.LAST_FRAME_KEY,
            function () {
                level.setTime(FrameCounter.v);
                FrameCounter.max = FrameCounter.v;
            }
        );
    };

    FrameCounter.t = function ()
    {
        return FrameCounter.v / FrameCounter._FPS;
    };

    FrameCounter.f2t = function(frameNumber) {
        return (frameNumber / FrameCounter._FPS);
    };

    FrameCounter.t2f = function(t) {
        return (t * FrameCounter._FPS);
    };

    FrameCounter.forward = function ()
    {
        FrameCounter._step = 2 * FrameCounter.BASE_STEP;
        FrameCounter._state = FrameCounter.GO;
    };

    FrameCounter.backward = function () {
        FrameCounter._step = -2 * FrameCounter.BASE_STEP;
        FrameCounter._state = FrameCounter.GO;
    };

    FrameCounter.gotoBeginning = function() {
        FrameCounter.gotoFrame(0);
        TQ.CommandMgr.directDo(new TQ.SetTimeCommand(FrameCounter.v));
    };

    FrameCounter.gotoEnd = function() {
        FrameCounter.gotoFrame(FrameCounter.max);
        TQ.CommandMgr.directDo(new TQ.SetTimeCommand(FrameCounter.v));
    };

    FrameCounter.gotoFrame = function(v) {
        FrameCounter.v = v;
        TQ.FrameCounter.isNew = true;
    };

    FrameCounter.goto = function(t) {
        FrameCounter.gotoFrame(t * FrameCounter._FPS);
    };

    // 前进一个delta. (delta是负值, 即为倒带)
    FrameCounter.update = function () {
        FrameCounter.updateState();
        if (!(FrameCounter._state == FrameCounter.GO)) {
            return ;
        }

        if (FrameCounter.hasUIData) {
            FrameCounter.hasUIData = false;
            return;
        }

        var delta = FrameCounter._step;
        FrameCounter.v = FrameCounter.v + delta;
        if(FrameCounter.v > FrameCounter.max) {
            FrameCounter.v = FrameCounter.max;
        }

        if(FrameCounter.v < 0) {
            if (FrameCounter._autoRewind) {
                FrameCounter.v = FrameCounter.max;
            } else {
                FrameCounter.v = 0;
            }
        }

        TQ.FrameCounter.isNew = true;
        assertTrue(TQ.Dictionary.CounterValidation, FrameCounter.v >= 0);
    };

    FrameCounter.updateState = function() {
        switch (FrameCounter._requestState) {
            case null: break;
            case FrameCounter.GO : {
                FrameCounter._step = FrameCounter.BASE_STEP;
                FrameCounter._state = FrameCounter.GO;
                break;
            }
            case FrameCounter.STOP: {
                FrameCounter._state = FrameCounter.STOP;
                break;
            }
        }
        FrameCounter._requestState = null;
    };

    // state: 不能由外部改变, 必须是update自己改变, 以保持其唯一性
    FrameCounter.play = function ()
    {
        FrameCounter._requestState = FrameCounter.GO;
        //ToDo: 暂时关闭GIF文件的生成
        /* if (TQ.InputMap.isPresseds[TQ.InputMap.LEFT_CTRL])
        {
            canvas.width = 180;
            canvas.height = 180;
            $("#testCanvas").hide();
            TQ.GifManager.begin();
        }
        */
    };

    FrameCounter.stop = function ()
    {
        FrameCounter._requestState = FrameCounter.STOP;
        TQ.CommandMgr.directDo(new TQ.SetTimeCommand(FrameCounter.v));
        if (TQ.GifManager.isOpen) {
            TQ.GifManager.end();
            canvas.width = TQ.Config.workingRegionWidth;
            canvas.height = TQ.Config.workingRegionHeight;
            $("#testCanvas").show();
        }
    };

    FrameCounter.autoRewind = function () {
        FrameCounter._autoRewind = !FrameCounter._autoRewind;
    };

    FrameCounter.isInverse = function () { return FrameCounter._step < 0;};
    FrameCounter.isPlaying = function () { return (FrameCounter._state == FrameCounter.GO); };
    FrameCounter.isRequestedToStop = function () { return (FrameCounter._requestState == FrameCounter.STOP); };
    FrameCounter.finished = function () { return (FrameCounter.v >= FrameCounter.max); };
    FrameCounter.isAutoRewind = function () { return FrameCounter._autoRewind; };

    FrameCounter.maxTime = function () {
        return FrameCounter.max / FrameCounter._FPS;
    };

    FrameCounter.reset = function () {
        FrameCounter._requestState = null;
        FrameCounter.v = 0;
        FrameCounter._state = (TQ.Config.AutoPlay ? FrameCounter.GO : FrameCounter.STOP);
    };

    TQ.FrameCounter = FrameCounter;
}());