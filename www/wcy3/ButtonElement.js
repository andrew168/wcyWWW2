/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 */
TQ = TQ || {};

(function() {
  // 用法: 1) 拖入一个按钮可以换皮肤，可以定义新的动作
  //  必须是用工厂生产这个元素, 因为, 是数据决定元素的类别.
  //  Button的状态：
  //     不可见，
  //      可见（执行可见的action），
  //      被按下，执行（被按下的action），
  //     再次转为不可见，          初始化状态

  function ButtonElement(level, jsonObj) {
    assertTrue(TQ.Dictionary.INVALID_PARAMETER, typeof jsonObj !== "string"); // 用工厂提前转为JSON OBJ,而且, 填充好Gap
    this.level = level;
    this.children = [];
    this.instance = null;
    this._isNewSkin = false;
    this.state2 = ButtonElement.INVISIBLE;
    // 缺省的行为
    this.onVisibleAction = "if (TQ.WCY.isPlayOnly) {TQ.WCY.doStop();}" +
            "else {$('#stop').click();}";
    this.onClickAction = "if (TQ.WCY.isPlayOnly) {TQ.WCY.doPlay();}" +
            "else {$('#play').click();}";
    this.actions = [];
    if (jsonObj.t0) { // 记录声音的插入点， 只在插入点开始播放
      this.t0 = jsonObj.t0;
    } else {
      this.t0 = 0;
    }
    this.initialize(jsonObj);
  }

  ButtonElement.INVISIBLE = 0x01;
  ButtonElement.VISIBLE = 0x04;
  ButtonElement.CLICKED = 0x08; //   也可见

  var p = ButtonElement.prototype = new TQ.Element(null, null);

  p._parent_afterItemLoaded = p._afterItemLoaded;
  p._afterItemLoaded = function(desc) {
    this._parent_afterItemLoaded(desc);
    if (this.level.isStageReady()) {
      if (this.jsonObj.t0 !== undefined) { // 必须是在 立即插入模式
        TQ.AnimeTrack.setButton(this, this.jsonObj.t0);
      }
    }
    this.buildLinks();
  };

  p._parent_doShow = p.doShow;
  p.doShow = function(isVisible) {
    this._parent_doShow(isVisible);
    if (isVisible) {
      if (this.state2 === ButtonElement.INVISIBLE) { // first time
        this.state2 = ButtonElement.VISIBLE;
        if (TQ.FrameCounter.isPlaying()) {
          // 不能直接用item.onPress = ele.onClick()，因为对象的主题变了。响应的时候，对象是Bitmap，不是按钮元素
          var item = this.displayObj;
          (function(ele) {
            item.onPress = function() {
              ele.onClick();
            };
          })(this);
        }

        TQ.ButtonMgr.addItem(this);
        this.onVisible();
      }
    } else {
      if (this.state2 !== ButtonElement.INVISIBLE) {
        this.state2 = ButtonElement.INVISIBLE;
        TQ.ButtonMgr.deleteItem(this);
      }
    }
  };

  p.setButton = function(t) {
    if (TQ.FrameCounter.isPlaying()) {
      TQ.AnimeTrack.setButton(this, t);
    }
  };

  p.onVisible = function() {
    if ((this.level.state === TQBase.LevelState.EDITING) ||
            (this.level.state === TQBase.LevelState.RUNNING)) {
      var t = TQ.FrameCounter.t();
      this.setButton(t);
      eval(this.onVisibleAction);
    }
  };

  p.onClick = function() {
    if (!TQ.SceneEditor.isPlayMode()) return; // 不是播放状态, 不响应click
    if (this.state2 === ButtonElement.VISIBLE) {
      this.state2 = ButtonElement.CLICKED;
      var item = this.displayObj;
      item.onPress = null;
    }

    eval(this.onClickAction);

    for (var i = 0; i < this.actions.length; i++) {
      var act = this.actions[i];
      if ((!act) || (!act.action)) continue; // 去除空的、被删除的响应,
      act.ele.playAction(act.action, true);
    }
  };

  p.addAction = function(ele, actionName) {
    var id = this._findAction(ele, actionName);
    if (id === TQ.ERROR) {
      this.actions.push({ ele: ele, action: actionName });
    } else {
      this.actions[id] = { ele: ele, action: actionName };
    }

    return id;
  };

  p.deleteAction = function(id) {
    if (id < this.actions.length) {
      this.actions[id] = null;
    }
  };

  p.removeAll = function() {
    this.actions.splice(0);
  };

  p._findAction = function(ele, actionName) {
    for (var i = 0; i < this.actions.length; i++) {
      var action = this.actions[i];
      if (!action) { // 被删除了
        continue;
      }
      if ((actionName === action.name) && (action.ele === ele)) {
        return i;
      }
    }

    return TQ.ERROR;
  };

  p.parent_toJSON = p.toJSON;
  p.toJSON = function() {
    this.parent_toJSON();
    if (this.actions) {
      this.jsonObj.actions = [];
      for (var i = 0; i < this.actions.length; i++) {
        var act = this.actions[i];
        this.jsonObj.actions.push({ elementId: act.ele.id, name: act.name });
      }
    }

    return this.jsonObj;
  };

  p.isButton = function() { return true; };
  p.buildLinks = function() {
    this.actions = [];
    if (!this.jsonObj.actions) return;
    for (var i = 0; i < this.jsonObj.actions.length; i++) {
      var act = this.jsonObj.actions[i];
      if ((!act) || (!act.action)) continue; // 去除空的、被删除的响应,
      var ele = this.level.findByDescId(act.id);
      if (ele) {
        this.addAction(ele, act.name);
      }
    }
  };
  TQ.ButtonElement = ButtonElement;
}());
