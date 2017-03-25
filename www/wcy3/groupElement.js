/**
 * Created by Andrewz on 3/25/2017.
 */
TQ = TQ || {};

(function () {
    // 用法: GroupElement, 一个container， 包裹其子孙
    function GroupElement(level, jsonObj) {
        TQ.Element.call(this, level, jsonObj);
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

    TQ.GroupElement = GroupElement;
}());
