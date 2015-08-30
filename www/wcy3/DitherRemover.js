/**
 * Tuqiang Game Engine
 * Copyright Tuqiang Tech
 * Created at : 12-11-13 下午7:16
 */
window.TQ = window.TQ || {};

(function () {
    function DitherRemover () {
    }
    var p = DitherRemover;
    p._LENGTH = 20; //N点加权平均法消除抖动
    p.buffer = [];
    p._on = false;
    p.enabled = false;
    p.start = function(xx, yy) {
        p.buffer.splice(0);
        p.buffer.push({x:xx, y:yy});
        p._on = true;
        return p.buffer[0];
    };

    p.close = function() {
        p.buffer.splice(0);
        p._on = false;
    };

    // 添加1个新的点, 获取消抖处理后的点
    p.smooth = function(xx,yy) {
        if (p.enabled) {
            if (!p._on)  {
                assertTrue(TQ.Dictionary.INVALID_LOGIC, false);
                return p.start(xx, yy);
            }
            if (__user_level == 8) {
                console.log(xx + ", " + yy);
            }
            if (p.buffer.length >= p._LENGTH) {
                p.buffer.shift();
            }
            p.buffer.push({x:xx, y:yy});
            xx = 0;
            yy = 0;
            var num = p.buffer.length;
            for (var i = 0; i < num; i++) {
                xx += p.buffer[i].x / num;
                yy += p.buffer[i].y / num;
            }
        }
        return {x:xx, y:yy};
    };

    p.isOn = function() { return p._on; };

    TQ.DitherRemover = DitherRemover;
}());