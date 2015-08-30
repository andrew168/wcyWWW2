/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 */
window.TQ = window.TQ || {};

//存放全局的API， 需要在所有模块都调入之后， 才能够执行， 否则没有函数。
(function () {
    function TouchMgr() {
    }
    var __debugOn = false;
    var __useTouchMgr = false;
    TouchMgr.initialize = function() {
        if (__useTouchMgr) {
            /*单指拖动*/
            var obj = document.getElementById('touchPic');
            // TouchMgr.addTouchHandler(obj);
            TouchMgr.addTouchHandler(document);
        }
    };

    TouchMgr.addTouchHandler = function (obj) {
        if (obj != null) {
            obj.addEventListener("touchstart", TouchMgr.handleTouchEvent, false);
            obj.addEventListener("touchend", TouchMgr.handleTouchEvent, false);
            obj.addEventListener("touchmove", TouchMgr.handleTouchEvent, false);
            obj.addEventListener("touchcancel", TouchMgr.handleTouchEvent, false);
            obj.addEventListener("gesturestart", TouchMgr.handleTouchEvent, false);
            obj.addEventListener("gestureend", TouchMgr.handleTouchEvent, false);
            obj.addEventListener("gesturechange", TouchMgr.handleTouchEvent, false);
            obj.addEventListener("onscroll", TouchMgr.handleTouchEvent, false);
        }
    }

    TouchMgr.handleTouchEvent = function (ev) {
        assertNotNull(TQ.Dictionary.INVALID_PARAMETER, ev.touches);
        assertNotNull(TQ.Dictionary.INVALID_PARAMETER, ev.changedTouches);
        //只跟踪一次触摸
        var numTouches = ev.touches.length,
            numChanges = ev.changedTouches.length;

        var output = document.getElementById("testLabelInfo");
        var xx = 0, yy = 0, xChanged = 0, yChanged = 0;
        var paras = ev.type + ":" + numTouches + "," + numChanges;
        if (ev.scale != null) {
            paras += ", " + TQ.MathExt.round2(ev.scale);
        } else {
            paras += ", " + 0;
        }

        if (ev.rotation != null) {
            paras += ", " + TQ.MathExt.round2(ev.rotation);
        } else {
            paras += ", " + 0;
        }
        var num = Math.max(numTouches, numChanges);
        for (var i=0; i < num; i++)
        {
            xx = 0, yy = 0, xChanged = 0, yChanged = 0;
            if (numTouches > i) {
                xx = ev.touches[i].clientX;
                yy = ev.touches[i].clientY;
            }

            if (numChanges > i) {
                xChanged = ev.changedTouches[i].clientX;
                yChanged = ev.changedTouches[i].clientY;
            }
            paras += ",(" + xx + "," + yy + ") (" + xChanged + ", " + yChanged + ")";
        }

        if ((numTouches >= 1) || (numChanges >= 1)) {
            switch (ev.type) {
                case "touchstart":
                    // ev.preventDefault(); // 不能阻止， 否则菜单操作不了
                    paras = "<br><br>Touch started: " + paras;
                    break;
                case "touchend":
                    // ev.preventDefault(); // 不能阻止， 否则菜单操作不了
                    paras = "<br>Touch ended: " + paras;
                    break;
                case "touchmove":
                    ev.preventDefault(); //阻止滚动, 必须的
                    paras = "<br>Touch moved :" + paras;
                    break;
                case "touchcancel":
                    ev.preventDefault(); //阻止滚动
                    paras = "<br>Touch cancel: " + paras;
                    break;

                case "gesturestart":
                    ev.preventDefault();
                    paras = "<br><br>Gesture started :" + paras;
                    break;
                case "gestureend":
                    ev.preventDefault();
                    paras = "<br>Gesture ended : " + paras;
                    break;

                case "gesturechange":
                    ev.preventDefault();
                    paras = "<br>Gesture changed :" + paras;
                    break;

                case "onscroll":
                    ev.preventDefault();
                    paras = "<br>onscroll :" + paras;
                    break;
                default:
                    paras = "<br>unknown event : " + paras;
            }

        } else {
            paras = "<br>有事件， 但是touches为空)：" + paras;
        }

        if (__debugOn) {
            if (output != null) {
                output.innerHTML += paras;
            } else {
                console.log(paras);
            }
        }
    };

    TQ.TouchMgr = TouchMgr;
}());
