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

  SoundMgr.queue = {};
  SoundMgr.manifest = [];
  SoundMgr.started = false;
  SoundMgr.isSupported = false;
  SoundMgr.initialize = function() {
    createjs.FlashPlugin.BASE_PATH = TQ.Config.SOUND_PLUGIN_PATH; // Initialize the base path from this document to the Flash Plugin
	
    // if initializeDefaultPlugins returns false, we cannot play sound in this browser
    if (!createjs.Sound.initializeDefaultPlugins()) { return; }
    SoundMgr.isSupported = true;

    // Instantiate a queue.
    SoundMgr.queue = new createjs.LoadQueue();
    SoundMgr.queue.installPlugin(createjs.Sound); // Plug in Sound to handle browser-specific paths

    //Available PreloadJS callbacks
    SoundMgr.queue.addEventListener("fileLoad", function(event) {
      TQ.Log.info(event.toString());
    });

    SoundMgr.queue.addEventListener("complete",  function(event) {
      TQ.Log.info(event.toString());
    });
  };

  SoundMgr.start = function ()
  {
    if (!SoundMgr.isSupported) return;

    // ToDo: 不重复 start ??
    SoundMgr.started = true;
    //Load the manifest and pass 'true' to start loading immediately. Otherwise, you can call load() manually.
    SoundMgr.queue.addEventListener("fileload", function(e) {TQ.Log.info("fileload:" + e.toString());});
    SoundMgr.queue.addEventListener("complete", function(e) {TQ.Log.info("complete:" + e.toString());});
    SoundMgr.queue.loadManifest(SoundMgr.manifest, true);
  };

  SoundMgr.add = function(resourceID, resourceForFF, resourceForCM) {
    if (!SoundMgr.isSupported) return;

    // 添加mp3和ogg两种文件， 以便于支持所有的平台
    //ToDo: 让Sound可以不断添加, 即使启动之后, 也能够添加.
    // ToDo: 不重复加入
    // 只是load新添加的内容,
    // 而系统能够自动启动load
    // assertFalse("启动之后, 不能添加, 必须在start之前添加全部", SoundMgr.started);
    SoundMgr.manifest.push({
      src : resourceForFF + "|" + // IE, CM, SF 支持MP3.
        resourceForCM,    // Firefox 支持 ogg格式和WAV,
      id : resourceID,   // Sound资源的id是字符串, 不是数字
      data : 1
    });
  };

  SoundMgr.play = function(id) {
    if (!SoundMgr.isSupported) return;

    // ToDo: 让同一个声音,  可以并行播放多份(打炮)
    TQ.Log.info("start to play " + id);
    //Play the sound: play (src, interrupt, delay, offset, loop, volume, pan)
    var instance = createjs.Sound.play(id, createjs.Sound.INTERRUPT_NONE, 0, 0, false, 1);
    return (instance == null || instance.playState == createjs.Sound.PLAY_FAILED);
  };

  SoundMgr.stop = function(id) {  createjs.Sound.stop(id); };

  SoundMgr.close = function() {
    if (!SoundMgr.isSupported) return;

    createjs.Sound.stop();
    if (SoundMgr.queue != null) {
      SoundMgr.queue.removeAll();
    }
    SoundMgr.started = false;
  };

  TQ.SoundMgr = SoundMgr;
}());