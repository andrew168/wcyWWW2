/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 */
TQ = TQ || {};

// ToDo: 暂停期间 的时间，要去除， 确保， resume之后 的动作与pause时候的动作是连续播放的，
(function () {
  /**
     * Action: 动作， 表示一个动作的名称， 起始帧，结束帧，循环方式
     * 循环方式： -1： 无限循环， 0： 单帧， 1： 只播放1次， N： 播放N次。
     * @param name
     * @param startFrame
     * @param endFrame
     * @param repeatStyle
     * @param gifIconId
     * @constructor
     */
  function Action(name, startFrame, endFrame, repeatStyle, gifIconId) {
    assertTrue(TQ.Dictionary.INVALID_PARAMETER, endFrame >= startFrame);
    assertFalse(TQ.Dictionary.INVALID_PARAMETER, !gifIconId);
    this.name = name;
    this.fs = startFrame;  //  该动作 从 [ts, te]
    this.F = endFrame - startFrame;  // 命令的时长,周长是 T
    this.n = 0; // 第一次播放，
    this.style = repeatStyle;
    this.state = Action.STOP;
    this.gifIconId = gifIconId;
    // this.initialize(jsonObj);
  }
  Action.STOP = 0;
  Action.PLAYING = 1;

  Action.STYLE_REPEAT = -1;
  Action.STYLE_1 = 1;   //     只播放1次
  var p = Action.prototype;
  p.play = function (t) {
    this.tc = t;  // 发布命令command的时间是 tc
    this.state = Action.PLAYING;
    this.T = this.F;
    this.ts = this.fs;
    this.tcn = this.tc + (this.n * this.T);   // tcn 是周期性的tc， 第n次播放时的相对起点
    this.te = this.tcn + this.T;
  };

  p.tMapping = function(t) {
    if ((t < this.tcn) || (t > this.te)) { // 配合倒退， 重播，等, 确保 t 在区间[tcn, te]内
      if (this.style == Action.STYLE_REPEAT) {  // 循环者， 修改tcn,te, n
        if (this.T > 0) {
          this.n = Math.floor((t - this.tc)/ this.T);
          if (t < this.tc) {
            this.n -= 1;
          }
          this.tcn = this.tc + (this.n * this.T);
          this.te = this.tcn + this.T;
        } else {
          this.tcn = t;
          this.te = t;
        }
      } else {  // 非循环者， 不修改tcn,te, n， 只限制t值在范围内
        t = TQ.MathExt.range(t, this.tcn, this.te);
      }
    }

    assertTrue(TQ.Dictionary.INVALID_PARAMETER, t >= this.tcn);
    return (this.ts + (t - this.tcn));
  };

  p.stop = function () {
    this.state = Action.STOP;
  };

  p.isPlaying = function() {
    return (this.state == Action.PLAYING);
  };

  TQ.Action = Action;
}());
