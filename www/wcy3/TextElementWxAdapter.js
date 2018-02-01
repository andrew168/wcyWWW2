/**
 * Created by Andrewz on 1/31/18.
 */
var TQ = TQ || {};
TQ.TextElementWxAdapter = (function() {
    return {
        detectFontSizeFactor: detectFontSizeFactor,
        cssFontSizeFactor: -1
    };

    function detectFontSizeFactor() {
        if (TQ.TextElementWxAdapter.cssFontSizeFactor > -1) {
            return;
        }
        // canvas 写的字大小不受webview的大小限制，但是，其getMeasuredWidth()是受限制的
        var str;
        var sizes = [10, 20, 50, 100, 200];

        str = "cssFontSize map:\n";
        var stdTextDomEle,
            cssFontSize200 = 0,
            cssFontSizeFactor = 1;

        sizes.forEach(function (fontSize) {
            stdTextDomEle = TQ.DomUtil.createElement(document.body, 'div', 'rem-test-text' + fontSize);
            cssFontSize200 = TQ.Utility.getCssSize(window.getComputedStyle(stdTextDomEle).fontSize);
            cssFontSizeFactor = 200 / cssFontSize200;
            str += fontSize + '  ' + cssFontSize200 + '\n';
            document.body.removeChild(stdTextDomEle);
        });
        // alert(str);
        // console.log('fontSize map:' + str);
        TQ.TextElementWxAdapter.cssFontSizeFactor = cssFontSizeFactor;
    }
}());
