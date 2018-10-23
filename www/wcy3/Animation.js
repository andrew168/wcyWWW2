/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 */
TQ = TQ || {};

(function () {
    /**
     * Animation, 是带有多个action的动作集合， Element是最多只有一个动作的元素。
     * @param jsonObj
     * @constructor
     */
    function Animation(jsonObj) {
        assertTrue(TQ.Dictionary.INVALID_PARAMETER, typeof jsonObj !='string');
        this.currentAction = null;
        this.actionTable = [];
        this.fixedUp(jsonObj);  //用于从数据文件建立动画
    }

    var p = Animation.prototype;
    Animation.unitTest = function(ele) {
        ele.addAction("idle", 1, 50, TQ.Action.STYLE_REPEAT);
        ele.addAction("work", 60, 120, TQ.Action.STYLE_REPEAT);
        ele.addAction("run", 130, 150, TQ.Action.STYLE_REPEAT);
        ele.addAction("smile", 160, 180, TQ.Action.STYLE_1);
        ele.addAction("stand", 181, 200, TQ.Action.STYLE_1);
    };

    /*
    用于从数据文件建立动画
     */
    p.fixedUp = function(jsonObj) {
        if ((jsonObj != null) && (jsonObj.actionTable != null)) {
            for (var i = 0; i < jsonObj.actionTable.length; i++) {
                var actionJson = jsonObj.actionTable[i];
                var fs = Number(actionJson.fs);
                var fe = fs + Number(actionJson.F);
                if (!actionJson.gifIconId) {
                    actionJson.gifIconId = TQ.Utility.getDefultActionIcon();
                }
                this.addAction(new TQ.Action(actionJson.name, fs, fe, actionJson.style, actionJson.gifIconId));
            }
        }
    };

    p.play = function (actionName) {
        this.currentAction = this._findAction(actionName);
        if (this.currentAction == TQ.ERROR) {
            TQ.MessageBubble.show(TQ.Dictionary.NAME_NOT_EXIST);
            if (actionName != "idle") {
                this.play("idle");
            }
        } else {
            this.currentAction.play(TQ.FrameCounter.t());
        }
    };

    p.pause = function () {
        assertNotNull(TQ.Dictionary.INVALID_PARAMETER, this.currentAction);
        if (this.currentAction != null) {
            this.currentAction.stop();
        }
    };

    p.resume = function() {
        assertNotNull(TQ.Dictionary.INVALID_PARAMETER, this.currentAction);
        if (this.currentAction != null) {
            this.currentAction.resume();
        }
    };

    p.stop = function () {
        assertNotNull(TQ.Dictionary.INVALID_PARAMETER, this.currentAction);
        if (this.currentAction != null) {
            this.currentAction.stop();
            this.currentAction = null;
        }
    };

    p.addAction = function(action, forceToUpdate) {
        var id  = this._findActionId(action.name);
        if (id != TQ.ERROR) { // 避免重复同名的动作, （如果已经有同名的， 则替换之）
            if (!forceToUpdate) {
                return false;
            }
            this.actionTable[id] = action;
        } else {
            this.actionTable.push(action);
        }
        return true;
    };

    p.deleteAction = function(name) {
        var id = this._findActionId(name);
        if (id == TQ.ERROR) {
            TQ.MessageBubble.show(TQ.Dictionary.INVALID_PARAMETER + name);
        } else {
            this.actionTable.splice(id, 1);
        }
    };

    // private function
    p._findActionId = function(actionName) {
        for (var i = 0; i < this.actionTable.length; i++) {
            if (this.actionTable[i].name == actionName) {
                return i;
            }
        }

        return TQ.ERROR; // !!!不能是null, 因为它和[0]元素是一样的。
    };

    p._findAction = function(actionName) {
        var id = this._findActionId(actionName);
        if (id != TQ.ERROR) {
            return this.actionTable[id];
        }
        return TQ.ERROR; // !!!不能是null, 因为它和[0]元素是一样的。
    };

    p.isAnimation = function() { return true; };
    p.isPlaying = function() { return ((this.currentAction != null) && (this.currentAction.isPlaying())); };
    p.hasAction = function(actionName) {
        return ((this._findAction(actionName) == TQ.ERROR) ? false :  true);
    };

    TQ.Animation = Animation;
}());
