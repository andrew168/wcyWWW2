/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 */
TQ = TQ || {};

(function () {
    /**
     * MultiView, 是带有多个view的元素集合， 模仿3D物体， 同时只能有一个元素可见。
     * @param jsonObj
     * @constructor
     */
    function MultiView(jsonObj) {
        assertTrue(TQ.Dictionary.INVALID_PARAMETER, typeof jsonObj !='string');
        this.viewId = 0; // 默认显示第一个视图的元素
        this.fixedUp(jsonObj);  //用于从数据文件建立动画
    }

    var p = MultiView.prototype;

    p.fixedUp = function(jsonObj) {
        if ((jsonObj != null) && (jsonObj.viewId != null)) {
            this.viewId = jsonObj.viewId;
        }
    };

    p.setupView = function() {
        TQ.InputMap.registerAction(TQ.InputMap.LEFT_ARROW, function() {
            var ele = TQ.SelectSet.peek();
            if ((ele != null) && (ele.viewCtrl != null)) {
                ele.viewCtrl.changeView(-1);
            }
        });
        TQ.InputMap.registerAction(TQ.InputMap.RIGHT_ARROW, function() {
            var ele = TQ.SelectSet.peek();
            if ((ele != null) && (ele.viewCtrl != null)) {
                ele.viewCtrl.changeView(1);
            }
        });
    };

    p.changeView = function(adjust) {
        if (this.parent == null)  return;

        this.viewId += adjust;
        var num = this.parent.children.length;
        this.viewId  = TQ.MathExt.range(this.viewId, 0, num-1 );
        for (var i = 0; i < num; i++) {
            var e = this.parent.children[i];
            e.show(i == this.viewId);
        }
    };

    p.hideView = function() {
        if ((!this.parent) || (!this.parent.children)) return;

        var t = TQ.FrameCounter.t();
        var num = this.parent.children.length;
        for (var i = 0; i < num; i++) {
            var e = this.parent.children[i];
            TQ.AnimeTrack.hide(e, t);
        }
    };

    p.unHideView = function() {
        var t = TQ.FrameCounter.t();
        var num = this.parent.children.length;
        for (var i = 0; i < num; i++) {
            var e = this.parent.children[i];
            TQ.AnimeTrack.unHide(e, t);
        }
    };

    p.attachTo = function(host) {
        if (host != null) {
            this.parent = host;
            host.viewCtrl = this;
            this.setupView();
            this.hideView();
            this.changeView(0);
        }
    };

    p.detach = function(host) {
        if (host != null) {
            this.unHideView();
            this.parent = null;
            host.viewCtrl = null;
        }
    };

    p.toJSON = function()
    {
        return this.viewId;
    };

    p.isMultiView = function() { return true; };

    TQ.MultiView = MultiView;
}());
