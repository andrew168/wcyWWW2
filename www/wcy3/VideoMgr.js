/**
 * Created by Andrewz on 1/6/19.
 * 图强动漫引擎,
 * 专利产品 领先技术
 * Video的Manager, 负责Video的preload, play, stop, 等一系列工作.
 * 包括正式场景中的 和 试播的
 * 是singleton
 */
TQ = TQ || {};
(function () {
  function VideoMgr() {
  }

  VideoMgr.started = false;
  VideoMgr.isSupported = false;
  VideoMgr.items = [];
  var isReseting = false,
    directVideos = {};

  VideoMgr.initialize = function () {
    VideoMgr.isSupported = true;
  };

  VideoMgr.start = function () {
    if (!VideoMgr.isSupported) return;

    // ToDo: 不重复 start ??
    VideoMgr.started = true;
  };

  /*
		专门用于试播，同时只允许播放1个。 试看新的，必须关闭旧的。
	 */
  VideoMgr._auditioningInstance = null;
  VideoMgr.isPlaying = function (instance) {
    if (!instance) return false;
    return (instance.playState === TQ.Video.PLAY_SUCCEEDED); // 包括paused， 不包括已经播完的
  };
  VideoMgr.play = function (id) {
    if (!VideoMgr.isSupported) return;
    TQ.Log.info("start to play " + id);
    var item = TQ.RM.getResource(id);
    if (item) {
      if (!!VideoMgr._auditioningInstance) {
        if (VideoMgr.isPlaying(VideoMgr._auditioningInstance)) {
          VideoMgr._auditioningInstance.stop();
        }
      }
      VideoMgr._auditioningInstance = TQ.Video.play(TQ.RM.getId(item));
      directVideos[id] = VideoMgr._auditioningInstance;
    } else {
      TQ.RM.addItem(id, function () {
        VideoMgr.play(id);
      });
    }
  };

  VideoMgr.stop = function (id) {
    TQ.Video.stop(directVideos[id]);
    delete directVideos[id];
  };

  function stopAllDirectVideo() {
    directVideos.forEach(function (id) {
      VideoMgr.stop(id);
    });
  }

  VideoMgr.addItem = function (ele) {
    if (VideoMgr.items.indexOf(ele) >= 0) { // 避免同一个元素（跨场景的），重复插入
      return;
    }
    VideoMgr.items.push(ele);
  };

  VideoMgr.deleteItem = function (ele) {
    var id = VideoMgr.items.indexOf(ele);
    if (id >= 0) {
      VideoMgr.items.splice(id, 1);
    }
  };

  VideoMgr.pause = function () {
    for (var i = VideoMgr.items.length; i--;) {
      VideoMgr.items[i].pause();
    }
  };

  VideoMgr.resume = function () {
    var t = TQ.FrameCounter.t();
    for (var i = 0; i < VideoMgr.items.length; i++) {
      var ele = VideoMgr.items[i];  //保留下来，避免正在resume的时候， 播完了， 被remove
      if (ele.isCrossLevel) {
        var tt = currScene.toGlobalTime(t);
        ele.resume(tt);
      } else {
        ele.resume(t);
      }
    }
  };

  VideoMgr.stopAll = function () {
    for (var i = 0; i < VideoMgr.items.length; i++) {
      var ele = VideoMgr.items[i];  //保留下来，避免正在resume的时候， 播完了， 被remove
      ele.stop();
    }
    if (!!VideoMgr._auditioningInstance) {
      VideoMgr._auditioningInstance.stop();
    }
    stopAllDirectVideo();
  };

  VideoMgr.iosForceToResumeAll = function () {
    for (var i = 0; i < VideoMgr.items.length; i++) {
      var ele = VideoMgr.items[i];  //保留下来，避免正在resume的时候， 播完了， 被remove
      if (ele.isVisible()) {
        ele.forceToReplay();
      }
    }
    stopAllDirectVideo();
  };

  VideoMgr.removeAll = function () {
    // 只删除那些不跨场景的
    for (var i = VideoMgr.items.length - 1; i >= 0; i--) {
      var ele = VideoMgr.items[i];
      if (ele.isCrossLevel && !isReseting) continue;
      ele.stop();
      VideoMgr.items.splice(i, 1);
    }
    stopAllDirectVideo();
  };

  VideoMgr.reset = function () {
    isReseting = true;
    VideoMgr.close();
    isReseting = false;
  };

  VideoMgr.close = function () {
    if (!VideoMgr.isSupported) return;
    VideoMgr.stopAll();
    VideoMgr.removeAll();
    VideoMgr.items.splice(0); //在退出微创意的时候，清除跨场景声音
    VideoMgr.started = false;
  };

  TQ.VideoMgr = VideoMgr;
}());
