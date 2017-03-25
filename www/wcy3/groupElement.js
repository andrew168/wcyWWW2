/**
 * Created by Andrewz on 3/25/2017.
 */
TQ = TQ || {};

(function () {
    // 用法: GroupElement, 一个container， 包裹其子孙
    function GroupElement(level, jsonObj) {
        TQ.Element.call(this, level, jsonObj);
    }

    GroupElement.create = create;
    function create(level, elements) {
        TQ.Log.out("Group it");
        if (!elements || !elements.length) {
            return;
        }

        // 以第一个物体的参数为主, 建立Group元素.
        var desc = {
            x: elements[0].jsonObj.x,
            y: elements[0].jsonObj.y,
            type: TQ.ElementType.GROUP,
            autoFit: TQ.Element.FitFlag.KEEP_SIZE
        };
        var ele = level.addElement(desc);
        ele.update(TQ.FrameCounter.t());

        for (var i = 0; i < elements.length; i++) {
            level.pickOffChild(elements[i]);
            ele.addChild(elements[i]);
        }
        return ele;
    }

    var p = GroupElement.prototype = Object.create(TQ.Element.prototype);
    p._doLoad = function () {
        assertNotNull(TQ.Dictionary.FoundNull, this.jsonObj); // 合并
        // 建立空的 displayObj 以容纳设备空间的参数
        this.displayObj = {};
        this.loaded = true;
        this._afterItemLoaded();
        this.setTRSAVZ();
    };

    p.explode = function() {
        // 普通group只炸开1层，
        // 关节：炸开整条链
        var parts = [];
        if (this.children) {
            while (this.children.length > 0) {
                var child = this.removeChild(this.children[0]);
                parts.push(child);
            }
        }
        return parts;
    };

    TQ.GroupElement = GroupElement;
}());
