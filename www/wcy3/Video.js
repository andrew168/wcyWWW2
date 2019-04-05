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
    this.host = null;
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

  var contentDiv;

  Video.loadVideoRes = loadVideoRes;
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
      TQ.AssertExt.depreciated('不支持这种case，必须有domEle，因为这是内部函数, 应该简化');
    }
    this.addToDom();
    if (this.domEle) {
      this.domEle.style.visibility = 'visible';
      var self = this;
      if (!TQ.State.needUserClickToPlayAV) {
        var playPromise = this.domEle.play();
        // if (playPromise !== null) {
        //   playPromise.catch(function(){self.domEle.play();});
        // }

        if (playPromise !== undefined) {
          playPromise.then(function (value) {
            self.domEle.play();
            if (self.host) {
              TQ.DirtyFlag.setElement(self.host);
            }
          }).catch(function (error) {
            console.log(error);
            console.log('Autoplay was prevented.' +
              'Show a "Play" button so that user can start playback');
          });
        }
      }
    }
  };

  p.addToDom = function () {
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
      this.playState = Video.PLAY_SUCCEEDED;
    }
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
      if (this.domEle && this.domEle.parentElement) {
        this.domEle.parentElement.removeChild(this.domEle);
        this.domEle.parentElement = null;
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

    loadVideoRes(src, function (ele) {
      self.domEle = ele;
      self.addToDom();
      if (onloadeddata) {
        onloadeddata(self);
      }
    });
  };

  function loadVideoRes(src, callback) {
    var ele = document.createElement('video'),
      starTime = Date.now();

    ele.addEventListener('loadeddata', onLoadedData, false);

    function onLoadedData(evt) {
      self.isGenerating = false;
      // this.updateSize();
      console.log(evt.srcElement.id + ' :' + starTime + ':' + (Date.now() - starTime) + " who fast: onloadeddata");
      if (callback) {
        callback(ele);
      }
    }

    // ele.addEventListener('loadstart', onWhoFast, false);
    ele.addEventListener('canplay', onWhoFast, false);
    ele.addEventListener('loadedmetadata', onWhoFast, false);
    ele.addEventListener('canplaythrough', onWhoFast, false);

    function onWhoFast(evt) {
      ele.removeEventListener('canplay', onWhoFast, false);
      ele.removeEventListener('loadedmetadata', onWhoFast, false);
      ele.removeEventListener('canplaythrough', onWhoFast, false);
      console.log(evt.srcElement.id + ' :' + starTime + ':' + (Date.now() - starTime) +
        ' who fast: ' + evt.type + ', ' + JSON.stringify(evt));
    }

    if (!TQUtility.isBlobUrl(src)) {
      src = TQ.RM.toFullPathFs(src);
    }
    ele.src = src;
    ele.id = src.substr(-10, 10).replace(/\/|\./g, '_') + starTime;
    ele.autoplay = true;
    ele.preload = 'metadata';
    ele.style.visibility = 'none';
    ele.className = 'video-layer video-container';
    // ele.controls = true;
    // ele.setAttribute("controls", "false");
  }

  p.getDuration = function () {
    if (this.duration && !isNaN(this.duration)) {
      return this.duration;
    }

    if (this.domEle && !isNaN(this.domEle.duration)) {
      return this.domEle.duration;
    }
    return 0;
  };

  TQ.Video = Video;
}());
