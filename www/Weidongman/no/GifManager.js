/**
 * 图强动漫引擎, 专利产品, 动画化的课件，一幅图胜过前言万语.
 * 强大的创意动力源泉
 * Begin, End,
 */

window.TQ = window.TQ || {};
var __gGifGenerator = null;

(function (){
    function GifManager()
    {
        assertNotHere(TQ.Dictionary.INVALID_LOGIC); // Singleton, 禁止调用
    }
    GifManager.isWorking = false;
    GifManager.isOpen = false;

    GifManager.begin = function ()
    {
        if (GifManager.isWorking) {
            assertTrue(TQ.Dictionary.INVALID_LOGIC, false);
            return;
        }

        if (!__gGifGenerator) {
            __gGifGenerator = new GIF({
                workers:'4',
                quality:'90',
                repeat:'0',
                background:'#000000',
                width:'180',
                height:'180'
            });
        }
        GifManager.isWorking = true;
        GifManager.isOpen = true;
    };

    GifManager.end = function () {
        if (!GifManager.isOpen) {
            assertTrue(TQ.Dictionary.INVALID_LOGIC, false);
            return;
        }

        if (__gGifGenerator) {
            __gGifGenerator.on('finished', function (blob) {
                if (TQ.Utility.hasEnv(TQ.Utility.BR_CHROME)) {
                    window.open(window.webkitURL.createObjectURL(blob));
                } else {
                    window.open(window.URL.createObjectURL(blob));  // FireFox
                }
                __gGifGenerator = null;
                GifManager.isWorking = false;
                TQ.MessageBubble.close();
            });
            __gGifGenerator.render();
            GifManager.isOpen = false;
            TQ.MessageBubble.show(TQ.Dictionary.IS_PROCESSING);
        }
    };

    GifManager.addFrame = function () {
        if ((!GifManager.isOpen) || (!__gGifGenerator)) {
            return;
        }
        __gGifGenerator.addFrame(canvas, {copy: true, delay: 20});
    };

    TQ.GifManager = GifManager;
}());