/**
 * Created by Andrewz on 1/6/19.
 * 图强动漫引擎,
 * 专利产品 领先技术
 * 选择集: 所有的操作都是基于选择集的
 */

TQ = TQ || {};
(function () {
  function Video() {
    this.playState = 0;
  }

  Video.UNKNOWN = 1;
  Video.LOADED = 2;
  Video.SHOW_FIRST_PAGE = 3;
  Video.PLAY_SUCCEEDED = 100; // == PLAYING, STARTED
  Video.PAUSED = 210;
  Video.STOPPED = 220;
  Video.ENDED = 230; // 自然结束， 停在结尾， （也包括stopped）

  Video.play = function (resId) {
    var instance = new Video(resId);
    instance.play();
    return instance;
  };

  Video.stop = function (instance) {
    instance.stop();
  };

  var p = Video.prototype;
  p.initialize = function () {
  };

  p.play = function() {
    this.playState = Video.PLAY_SUCCEEDED;
  };

  p.stop = function (res) {
    this.playState = Video.STOPPED;
  };

  TQ.VideoLib = Video;
}());
