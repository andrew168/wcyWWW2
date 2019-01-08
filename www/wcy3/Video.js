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
  Video.PLAY_FINISHED = 230;
  Video.PLAY_INTERRUPTED = 300;
  Video.PLAY_FAILED = 310;
  Video.INTERRUPT_NONE = 320;

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
    if (instance) {
      instance.stop();
    }
  };

  var p = Video.prototype;
  p.initialize = function () {
  };

  p.play = function() {
    if (!this.isInDom) {
      this.isInDom = true;
      this.duration = this.domEle.duration;
      this.domEle.style.width = TQ.Config.workingRegionWidth + 'px';
      this.domEle.style.height = TQ.Config.workingRegionHeight + 'px';
      this.domEle.style.left = TQ.Config.workingRegionX0 + 'px';
      this.domEle.style.top = TQ.Config.workingRegionY0 + 'px';
      document.body.appendChild(this.domEle);
    }
    if (this.domEle) {
      this.domEle.style.visibility = 'visible';
      var self = this;
      const playPromise = this.domEle.play();
      // if (playPromise !== null) {
      //   playPromise.catch(function(){self.domEle.play();});
      // }

      if (playPromise !== undefined) {
        playPromise.then(function (value) {
          self.domEle.play();
        }).catch(function (error) {
          console.log(error);
          console.log('Autoplay was prevented.' +
            'Show a "Play" button so that user can start playback');
        });
      }
    }
    this.playState = Video.PLAY_SUCCEEDED;
  };

  p.stop = function (res) {
    if (this.domEle) {
      this.domEle.pause();
    }
    this.playState = Video.PLAY_INTERRUPTED;
  };
  p.resume = function () {
    this.play();
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
      src = TQ.RM.toFullPathFs(src);
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
