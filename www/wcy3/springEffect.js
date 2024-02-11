/**
 * Created by Andrewz on 8/15.
 * 实现简单动画中的弹簧效果，阻尼damping，衰减attenuation
 *    Y = Y1*Y2
 *    Y1 = A * e^(-lambda * t)
 *    Y2 = cos(W * t + phi)
 *  *入口： 震荡的起始速度， 总震荡时间 (0.5秒)
 *   用2个周期T完成震荡
 */

var TQ = TQ || {};
TQ.SpringEffect = (function() {
  var PHI = -90 * Math.PI / 180;
  var defaultConfig = {
    actualSpeed: 1,
    dampingDuration: 0.4,
    numCycles: 2
  };

  return {
    defaultConfig: defaultConfig,
    cal: cal,
    getDampingT0: getDampingT0
  };

  /**
     * 入口：
     * @param sag
     *       actualSpeed: sag的速度，也是震荡的起始速度
     *       dampingDuration: 总震荡时间 (0.5秒),
     *       numCycles: 用N=4个周期T完成
     * @param deltaT: 震荡时间dt， deltaT = 0是震荡开始
     * @returns {number}: 震荡的位移（相对于目标位置）
     */
  function cal(sag, deltaT) {
    /** 主要公式
         * T = 总震荡时间/震荡周期数2
         * 最大振幅： A = 震荡的起始速度 * (1/4周期的时间)
         * 半衰减期时长0.693* Lambda(占1个周期T） :  ==> Lambda = T/0.693
         * 角速度： w = 2*PI*f = 2*PI * 1/T
         */
    var speed0 = sag.actualSpeed || defaultConfig.actualSpeed;
    var dampingDuration = sag.dampingDuration || defaultConfig.dampingDuration;
    var numCycles = sag.numCycles || defaultConfig.numCycles;
    var T = dampingDuration / numCycles;
    var A = speed0 * T / 4 / 5; var // 比 1/4周期，再缩小1/5, 幅度不能太大，
      lambda = 20 * T / 0.693; //* 增大20倍， 以快速衰减
    var w = 2 * Math.PI / T;
    var deltaY = 0;

    // 好数据：
    // A = 20;
    // lambda = 8;
    // w = 20;
    if (deltaT < dampingDuration) {
      var A1 = A * Math.pow(Math.E, -lambda * deltaT);
      deltaY = A1 * Math.cos(w * deltaT + PHI);
    }

    return deltaY;
  }

  function getDampingT0(sag) {
    var dampingDuration = (!sag || sag.dampingDuration === undefined) ? defaultConfig.dampingDuration
      : sag.dampingDuration;

    return sag.t2 - dampingDuration;
  }
}());
