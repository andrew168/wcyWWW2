/**
 *  Overlay 存放的是系统用的咨询， 与用户创造的数据无关。
 *  所以， 程序启动之后， 初始化一次就够了，
 *  不需要在每次open/save/new文件的时候重新初始化。
 * */
window.TQ = window.TQ || {};

(function () {
    function Overlay(description) {
        this.initialize(description);
    }

    var p =Overlay.prototype = new TQ.Level();
    p.Level_update = p.update;
    p.Level_initialize = p.initialize;
    p.initialize = function (desc) {
        if (!desc.name) {
          desc.name = "overlay";
        }
        this.Level_initialize(desc);
        this.show();
    };

    p.update = function(deltaT) {
        this.Level_update(deltaT);
        if (null === stage.selectedItem)
        {
            this.hideClipPoint( true);
        } else {
            this.hideClipPoint(false);
        }
    };

    p.hideClipPoint = function(isVisible) {
        for (var i = 0; i < this.elements.length; ++i) {
            if (this.elements[i].isClipPoint() && (this.elements[i].displayObj != undefined )) {
                this.elements[i].show(isVisible);
            }
        }
    };

    TQ.Overlay = Overlay;
}());
