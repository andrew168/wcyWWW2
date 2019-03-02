/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 * Sound的Manager, 负责Sound的preload, play, stop, 等一系列工作.
 * 是singleton
 */
TQ = TQ || {};
(function () {
    function SoundMgr() {
    }

    SoundMgr.started = false;
    SoundMgr.isSupported = false;
    SoundMgr.items = [];
    var isReseting = false,
        directSounds = [],
        unlocked = false;

    SoundMgr.initialize = function() {
        SoundMgr.isSupported = true;
      var plugins;
      var result;
      TQ.State.audioMethod = 4;
      if (createjs.BrowserDetect.isIOS ||   // Chrome, Safari, IOS移动版 都支持MP3，
        TQ.Base.Utility.isMobileDevice()) { // 把最希望使用的排在1st位置
        switch (TQ.State.audioMethod) {
          case 1:
            plugins = [createjs.WebAudioPlugin];
            break;
          case 2:
            plugins = [createjs.HTMLAudioPlugin];
            break;
          case 3:
            plugins = [createjs.CordovaAudioPlugin];
            break;
          default:
            plugins = [createjs.WebAudioPlugin, createjs.HTMLAudioPlugin, createjs.CordovaAudioPlugin];
            break;
        }
      } else { // Firefox只在vista以上OS中支持MP3，且自动加载MP3尚未实现， 所以用flash
        plugins = [createjs.WebAudioPlugin, createjs.HTMLAudioPlugin];
//            createjs.Sound.registerPlugins([createjs.FlashPlugin, createjs.WebAudioPlugin, createjs.HTMLAudioPlugin]); // need this so it doesn't default to Web Audio
        // 在Firefox下， 如果只加Flash声音， 则 无法预先加载WAV
      }

      result = createjs.Sound.registerPlugins(plugins);

      if (result) {
        TQDebugger.Panel.logInfo("声音 @" + createjs.Sound.activePlugin.toString());

        if (!TQ.QueryParams.disableAudioUnlock) {
          document.addEventListener("mousedown", unlockAudio, true);
          document.addEventListener("touchstart", unlockAudio, true);
          document.addEventListener("touchend", unlockAudio, true);
        }
      } else {
        TQDebugger.Panel.logInfo("无声音");
      }
    };

    SoundMgr.start = function ()
    {
        if (!SoundMgr.isSupported) return;

        // ToDo: 不重复 start ??
        SoundMgr.started = true;
     };

    /*
      专门用于试听声音，同时只允许播放1个。 试听新的必须关闭旧的。
     播放声音文件，id就是fileName，是声音文件的路径和名称， （从服务器的根目录计算， 不带域名)，
     例如： "mcSounds/test1.mp3"
     */
    SoundMgr._auditioningInstance = null;
    SoundMgr.isPlaying = function (soundInstance) {
        if (!soundInstance) return false;
        return (soundInstance.playState == createjs.Sound.PLAY_SUCCEEDED); // 包括paused， 不包括已经播完的
    };
    SoundMgr.play = function(id) {
        if (!SoundMgr.isSupported) return;
        TQ.Log.info("start to play " + id);
        var item = TQ.RM.getResource(id);
        if (item) {
            if (!!SoundMgr._auditioningInstance) {
                if (SoundMgr.isPlaying(SoundMgr._auditioningInstance)) {
                    SoundMgr._auditioningInstance.stop();
                }
            }
            SoundMgr._auditioningInstance = createjs.Sound.play(TQ.RM.getId(item)); // 用Sound.play, 可以播放多个instance， 声音只用ID， 不要resouce data
            directSounds.push(id);
            return SoundMgr._auditioningInstance;
        } else {
            TQ.RM.addItem(id, function() {SoundMgr.play(id);});
            return null;
        }
    };

    SoundMgr.stop = function(id) {
        createjs.Sound.stop(id);
        var index = directSounds.indexOf(id);
        directSounds.splice(index, 1);
    };

    function stopAllDirectSound() {
        if (directSounds.length > 0) {
            var temp = directSounds.slice(0);
            temp.forEach(function (id) {
                SoundMgr.stop(id);
            })
        }
    }

    SoundMgr.addItem =function(ele) {
        if (SoundMgr.items.indexOf(ele) >=0) { // 避免同一个元素（跨场景的），重复插入
            return;
        }
        SoundMgr.items.push(ele);
    };

    SoundMgr.deleteItem = function(ele) {
        var id = SoundMgr.items.indexOf(ele);
        if (id >= 0) {
            SoundMgr.items.splice(id, 1);
        }
    };

    SoundMgr.pause = function () {
        for (var i = SoundMgr.items.length; i--; ) {
            SoundMgr.items[i].pause();
        }
    };

    SoundMgr.resume = function () {
        var t = TQ.FrameCounter.t();
        for (var i = 0; i < SoundMgr.items.length; i++) {
            var ele = SoundMgr.items[i];  //保留下来，避免正在resume的时候， 播完了， 被remove
            if (ele.isCrossLevel) {
        		var tt = currScene.toGlobalTime(t);
                ele.resume(tt);
            } else {
                ele.resume(t);
            }
        }
    };

    SoundMgr.stopAll = function() {
        for (var i = 0; i < SoundMgr.items.length; i++) {
            var ele = SoundMgr.items[i];  //保留下来，避免正在resume的时候， 播完了， 被remove
            ele.stop();
        }
        if (!!SoundMgr._auditioningInstance) {
            SoundMgr._auditioningInstance.stop();
        }
        stopAllDirectSound();
    };

    SoundMgr.iosForceToResumeAll = function () {
        for (var i = 0; i < SoundMgr.items.length; i++) {
            var ele = SoundMgr.items[i];  //保留下来，避免正在resume的时候， 播完了， 被remove
            if (ele.isVisible()) {
                ele.forceToReplay();
            }
        }
        stopAllDirectSound();
    };

    SoundMgr.removeAll = function()
    {
        // 只删除那些不跨场景的
        for (var i = SoundMgr.items.length - 1; i >=0; i--) {
            var ele = SoundMgr.items[i];
            if (ele.isCrossLevel && !isReseting) continue;
            ele.stop();
            SoundMgr.items.splice(i,1);
        }
        stopAllDirectSound();

        if (!!SoundMgr._auditioningInstance) {
          if (SoundMgr.isPlaying(SoundMgr._auditioningInstance)) {
            SoundMgr._auditioningInstance.stop();
          }
          SoundMgr._auditioningInstance = null;
        }
    };

    SoundMgr.reset = function () {
        isReseting = true;
        SoundMgr.close();
        isReseting = false;
    };

    SoundMgr.close = function() {
        if (!SoundMgr.isSupported) return;
        SoundMgr.stopAll();
        // createjs.Sound.stop();  // 应该已经被stopAll取代了
        SoundMgr.removeAll();
        SoundMgr.items.splice(0); //在退出微创意的时候，清除跨场景声音
        SoundMgr.started = false;
    };

    function unlockAudio() {
      if (unlocked) {
        return;
      }

      unlocked = true;
      tryPlayAudio();
      document.removeEventListener("mousedown", unlockAudio, true);
      document.removeEventListener("touchend", unlockAudio, true);
      document.removeEventListener("touchstart", unlockAudio, true);
    }

    function tryPlayAudio() {
      var inst = SoundMgr.play(TQ.RM.NOSOUND);
      if (inst) {
        inst.on("complete", onCompleted);
        function onCompleted() {
          var msg = "Unlocked";
          if (createjs.Sound.activePlugin.context) {
            msg += ', state = ' + createjs.Sound.activePlugin.context.state;
          }
          TQDebugger.Panel.logInfo(msg);
          inst.off("complete", onCompleted);
        }
      }
      if (createjs.Sound.activePlugin && createjs.Sound.activePlugin.playEmptySound) {
        createjs.Sound.activePlugin.playEmptySound();
      }
    }

    TQ.SoundMgr = SoundMgr;
}());
