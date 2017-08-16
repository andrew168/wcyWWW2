/**
 * Created by Andrewz on 8/15.
 * 实现简单动画中的弹簧效果，阻尼damping，衰减attenuation
 *    Y = Y1*Y2
 *    Y1 = A * e^(-lambda * t)
 *    Y2 = cos(W * t + phi)
 * 入口： 震荡的起始速度， 总震荡时间 (0.5秒)， 用4个周期T完成
 *  ==> T= 总震荡时间/4 = 0.125
 *  ==> 最大振幅： A = 震荡的起始速度 * 1秒
 *  ==> 半衰减期的(占2个周期T） = 0.693* Lambda ==> Lambda = 2*T/0.693
 *  ==> w = 2*PI*f = 2*PI * 1/T
 */

var TQ = TQ || {};
TQ.SpringEffect = (function(){
    var PHI = -90 * Math.PI/180,
        defaultConfig = {
            actualSpeed: 1,
            dampingDuration: 0.5,
            numCycles: 4
        };

    return {
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
         * T = 总震荡时间/4
         * 最大振幅： A = 震荡的起始速度 * 1秒
         * 半衰减期时长0.693* Lambda(占2个周期T） :  ==> Lambda = 2*T/0.693
         * 角速度： w = 2*PI*f = 2*PI * 1/T
         */
        var speed0 = sag.actualSpeed || defaultConfig.actualSpeed,
            dampingDuration = sag.dampingDuration || defaultConfig.dampingDuration,
            numCycles = sag.numCycles || defaultConfig.numCycles,
            T = dampingDuration / numCycles,
            A = speed0 * 1,// 1 second,
            lambda = 2 * T / 0.693,
            w = 2 * Math.PI / T,
            deltaY = 0;

        if (deltaT < dampingDuration) {
            var A1 = A * Math.pow(Math.E, -lambda * deltaT);
            deltaY = A1 * Math.cos(w * deltaT + PHI);
        }

        return deltaY;
    }

    function getDampingT0(sag) {
        var dampingDuration = sag.dampingDuration || defaultConfig.dampingDuration;
        return sag.t2 - dampingDuration;
    }
}());
