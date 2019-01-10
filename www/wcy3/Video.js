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
    this.createVideoElement(src, onStarted);
  }

  Video.UNKNOWN = 1;
  Video.LOADED = 2;
  Video.SHOW_FIRST_PAGE = 3;
  Video.PLAY_SUCCEEDED = 100; // == PLAYING, STARTED
  Video.PLAY_FINISHED = 230;
  Video.PLAY_INTERRUPTED = 300;
  Video.PLAY_FAILED = 310;
  Video.INTERRUPT_NONE = 320;

  var contentDiv,
    lastHeight,
    lastWith;

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

  p.reset = function () {
    if (this.domEle) {
      this.domEle.currentTime = 0;
    }
  };

  p.play = function() {
    if (!this.domEle) {
      var self = this;
      return this.createVideoElement(self.src, function () {
        self.play();
      })
    }

    if (!this.isInDom || (lastWith !== TQ.Config.workingRegionWidth) || (lastHeight !== TQ.Config.workingRegionHeight)) {
      this.domEle.style.width = TQ.Config.workingRegionWidth + 'px';
      this.domEle.style.height = TQ.Config.workingRegionHeight + 'px';
      this.domEle.style.left = TQ.Config.workingRegionX0 + 'px';
      this.domEle.style.top = TQ.Config.workingRegionY0 + 'px';
      lastWith = TQ.Config.workingRegionWidth;
      lastHeight = TQ.Config.workingRegionHeight;
    }

    if (!this.isInDom) {
      this.isInDom = true;
      this.duration = this.domEle.duration;
      if (!contentDiv) {
        contentDiv = document.getElementById('testCanvas');
        if (contentDiv && contentDiv.parentElement) {
          contentDiv = contentDiv.parentElement;
        }
      }
      if (!contentDiv) {
        TQ.AssertExt.invalidLogic(false, "DOM中，需要有id为testCanvas的元素");
      } else {
        contentDiv.appendChild(this.domEle);
      }
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
      if (this.domEle) {
        this.domEle.parentElement.removeChild(this.domEle);
        this.domEle = null;
      }
    }
  };

  p.createVideoElement = function (src, onloadeddata) {
    var self = this;
    if (self.isGenerating) {
      return;
    }
    self.isGenerating = true;
    self.src = src;

    var ele = document.createElement('video');
    ele.onloadeddata = function (evt) {
      self.isGenerating = false;
      if (onloadeddata) {
        onloadeddata(evt);
      }
    };
    if (!TQUtility.isBlobUrl(src)) {
      src = TQ.RM.toFullPathFs(src);
    }
    ele.src = src;
    ele.autoplay = false;
    ele.style.visibility = 'none';
    ele.className = 'video-layer video-container';
    // ele.controls = true;
    // ele.setAttribute("controls", "false");
    self.domEle = ele;
  };

  TQ.Video = Video;
}());
