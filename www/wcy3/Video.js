/**
 * Created by Andrewz on 1/6/19.
 * 图强动漫引擎,
 * 专利产品 领先技术
 * 选择集: 所有的操作都是基于选择集的
 */

TQ = TQ || {};
(function () {
  function Video(src, onStarted) {
    this.playState = 0;
    this.domEle = createVideoElement(src, onStarted);
    this.src = src;
  }

  Video.UNKNOWN = 1;
  Video.LOADED = 2;
  Video.SHOW_FIRST_PAGE = 3;
  Video.PLAY_SUCCEEDED = 100; // == PLAYING, STARTED
  Video.PAUSED = 210;
  Video.STOPPED = 220;
  Video.ENDED = 230; // 自然结束， 停在结尾， （也包括stopped）

  Video.play = function (resId, onStarted) {
    var instance = new Video(resId, function () {
      instance.play();
      if (onStarted) {
        onStarted(instance);
      }
    });
    return instance;
  };

  Video.stop = function (instance) {
    instance.stop();
  };

  var p = Video.prototype;
  p.initialize = function () {
  };

  p.play = function() {
    if (!this.isInDom) {
      this.isInDom = true;
      document.body.appendChild(this.domEle);
    }
    if (this.domEle) {
      this.domEle.style.visibility = 'visible';
      this.domEle.style.width = TQ.Config.workingRegionWidth + 'px';
      this.domEle.style.height = TQ.Config.workingRegionHeight + 'px';
      this.domEle.style.left = TQ.Config.workingRegionX0 + 'px';
      this.domEle.style.top = TQ.Config.workingRegionY0 + 'px';
      this.domEle.play();
    }
    this.playState = Video.PLAY_SUCCEEDED;
  };

  p.stop = function (res) {
    if (this.domEle) {
      this.domEle.pause();
    }
    this.playState = Video.STOPPED;
  };

  p.removeFromDom = function () {
    if (this.isInDom) {
      this.isInDom = false;
      document.body.removeChild(this.domEle);
    }
  };

  var createVideoElement = function (src, onloadeddata) {
    var ele = document.createElement('video');
    ele.onloadeddata = onloadeddata;
    if (!TQUtility.isBlobUrl(src)) {
      src = TQ.ResourceManager.toFullPath(src);
    }
    ele.src = src;
    ele.autoplay = false;
    ele.style.visibility = 'none';
    ele.className = 'video-layer video-container';
    // ele.controls = true;
    // ele.setAttribute("controls", "false");
    return ele;
  };

  TQ.Video = Video;
}());
