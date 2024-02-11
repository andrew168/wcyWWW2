/**
 * Created by Andrewz on 3/7/19.
 */

(function() {
  var p = createjs.Stage.prototype;
  var Stage = createjs.Stage;

  Stage.__debugOn = false;
  // extended method
  p.enableDOMEvents = function(enable) {
    if (enable == null) {
      enable = true;
    }
    var n; var o; var ls = this._eventListeners;
    if (!enable && ls) {
      for (n in ls) {
        o = ls[n];
        o.t.removeEventListener(n, o.f);
      }
      this._eventListeners = null;
    } else if (enable && !ls && this.canvas) {
      var t = window.addEventListener ? window : document;
      var _this = this;
      ls = this._eventListeners = {};
      ls["mouseup"] = {
        t: t, f: function(e) {
          _this._handleMouseUp(e);
        }
      };
      // ls["touchend"] = {t:t, f:function(e) { _this._handleTouchEnd(e)} };
      // ls["touchcancel"] = {t:this.canvas, f:function(e) { _this._handleTouchCancel(e)} };
      ls["mousemove"] = {
        t: t, f: function(e) {
          _this._handleMouseMove(e);
        }
      };
      // ls["touchmove"] = {t:t, f:function(e) { _this._handleTouchMove(e)} };
      ls["dblclick"] = {
        t: t, f: function(e) {
          _this._handleDoubleClick(e);
        }
      };
      ls["mousedown"] = {
        t: this.canvas, f: function(e) {
          _this._handleMouseDown(e);
        }
      };
      ls["touchstart"] = {
        t: this.canvas, f: function(e) {
          _this._handleTouchStart(e);
        }
      };

      for (n in ls) {
        o = ls[n];
        o.t.addEventListener(n, o.f);
      }
    }
  };

  var _isProcessing = false;
  p._handleTouchMove = function(e) {
    if (Stage.__debugOn) {
      console.log("Touch Move");
    }

    if (_isProcessing) {
      e.stopPropagation();
      e.preventDefault();
      return;
    }
    _isProcessing = true;
    setTimeout(function() {
      _isProcessing = false;
    }, 100); // 最多200ms处理一个event

    if (!e) {
      e = window.event;
    }

    assertNotNull(TQ.Dictionary.INVALID_PARAMETER, e.touches);
    assertNotNull(TQ.Dictionary.INVALID_PARAMETER, e.changedTouches);
    if (e.touches && (e.touches.length >= 1)) {
      var xx = e.touches[0].clientX; // ToDo: 暂时只处理第一个触摸物体
      var yy = e.touches[0].clientY;
      this._handlePointerMove(-1, e, xx, yy);
    }
  };

  /**
   * @method _handlePointerMove
   * @protected
   * @param {Number} id
   * @param {Event} e
   * @param {Number} pageX
   * @param {Number} pageY
   **/
  p._handlePointerMove = function(id, e, pageX, pageY) {
    if (!this.canvas) {
      return;
    } // this.mouseX = this.mouseY = null;
    if (TQ.DitherRemover.isOn()) {
      var smoothXY = TQ.DitherRemover.smooth(pageX, pageY);
      pageX = smoothXY.x;
      pageY = smoothXY.y;
    }
    var evt;
    var o = this._getPointerData(id);

    var inBounds = o.inBounds;
    this._updatePointerPosition(id, pageX, pageY);
    if (!inBounds && !o.inBounds && !this.mouseMoveOutside) {
      return;
    }

    if (this.onMouseMove || this.hasEventListener("stagemousemove")) {
      evt = new createjs.MouseEvent("stagemousemove", o.x, o.y, this, e, id, id == this._primaryPointerID, o.rawX, o.rawY);
      this.onMouseMove && this.onMouseMove(evt);
      this.dispatchEvent(evt);
    }

    var oEvt = o.event;
    if (oEvt && (oEvt.onMouseMove || oEvt.hasEventListener("mousemove"))) {
      evt = new createjs.MouseEvent("mousemove", o.x, o.y, oEvt.target, e, id, id == this._primaryPointerID, o.rawX, o.rawY);
      oEvt.onMouseMove && oEvt.onMouseMove(evt);
      oEvt.dispatchEvent(evt, oEvt.target);
    }

    if (!evt) {
    } else {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  p._handleMouseUp = function(e) {
    if (Stage.__debugOn) {
      console.log("Mouse Up");
    }
    this._handlePointerUp(-1, e, false);
  };

  p._handleTouchEnd = function(e) {
    if (Stage.__debugOn) {
      console.log("Touch End");
    }

    this._handlePointerUp(-1, e, false);
  };

  p._handleTouchCancel = function(e) {
    if (Stage.__debugOn) {
      console.log("Touch Cancel");
    }
    this._handlePointerUp(-1, e, false);
  };

  p._handlePointerUp = function(id, e, clear) {
    var o = this._getPointerData(id);
    var evt;
    TQ.DitherRemover.close();
    if (this.onMouseMove || this.hasEventListener("stagemouseup")) {
      evt = new createjs.MouseEvent("stagemouseup", o.x, o.y, this, e, id, id == this._primaryPointerID, o.rawX, o.rawY);
      this.onMouseUp && this.onMouseUp(evt);
      this.dispatchEvent(evt);
    }

    var oEvt = o.event;
    if (oEvt && (oEvt.onMouseUp || oEvt.hasEventListener("mouseup"))) {
      evt = new createjs.MouseEvent("mouseup", o.x, o.y, oEvt.target, e, id, id == this._primaryPointerID, o.rawX, o.rawY);
      oEvt.onMouseUp && oEvt.onMouseUp(evt);
      oEvt.dispatchEvent(evt, oEvt.target);
    }

    var oTarget = o.target;
    if (oTarget && (oTarget.onClick || oTarget.hasEventListener("click")) && this._getObjectsUnderPoint(o.x, o.y, null, true, (this._mouseOverIntervalID ? 3 : 1)) == oTarget) {
      evt = new createjs.MouseEvent("click", o.x, o.y, oTarget, e, id, id == this._primaryPointerID, o.rawX, o.rawY);
      oTarget.onClick && oTarget.onClick(evt);
      oTarget.dispatchEvent(evt);
    }

    if (clear) {
      if (id == this._primaryPointerID) {
        this._primaryPointerID = null;
      }
      delete (this._pointerData[id]);
    } else {
      o.event = o.target = null;
    }

    if ((!evt) && (!oEvt) && (!oTarget)) {
    } else {
      e.stopPropagation();
      e.preventDefault();
    }
  };

  p._handleTouchStart = function(e) {
    if (Stage.__debugOn) {
      console.log("Touch Start");
    }

    if (_isProcessing) {
      e.stopPropagation();
      e.preventDefault();
      return;
    }
    _isProcessing = true;
    setTimeout(function() {
      _isProcessing = false;
    }, 1); // 最多200ms处理一个event
    this._handlePointerDown(-1, e, false);
  };

  p._handlePointerDown = function(id, e, x, y) {
    var o = this._getPointerData(id);

    if (e.touches && (e.touches.length >= 1)) {
      x = e.touches[0].pageX;
      y = e.touches[0].pageY;
    }

    if (y != null) {
      TQ.DitherRemover.start(x, y);
      this._updatePointerPosition(id, x, y);
    }

    if (this.onMouseDown || this.hasEventListener("stagemousedown")) {
      var evt = new createjs.MouseEvent("stagemousedown", o.x, o.y, this, e, id, id == this._primaryPointerID, o.rawX, o.rawY);
      this.onMouseDown && this.onMouseDown(evt);
      this.dispatchEvent(evt);
    }

    var target = this._getObjectsUnderPoint(o.x, o.y, null, (this._mouseOverIntervalID ? 3 : 1));
    this._setSelectedItem(target);
    if (target) {
      o.target = target;
      if (target.onPress || target.hasEventListener("mousedown")) {
        evt = new createjs.MouseEvent("mousedown", o.x, o.y, target, e, id, id == this._primaryPointerID, o.rawX, o.rawY);
        target.onPress && target.onPress(evt);
        target.dispatchEvent(evt);

        if (evt.onMouseMove || evt.onMouseUp || evt.hasEventListener("mousemove") || evt.hasEventListener("mouseup")) {
          o.event = evt;
        }
      }
    }

    if ((!evt)) {
    } else {
      e.stopPropagation();
      e.preventDefault();
    }
  };

  p._handleDoubleClick = function(e) {
    var o = this._getPointerData(-1);
    var target = this._getObjectsUnderPoint(o.x, o.y, null, (this._mouseOverIntervalID ? 3 : 1));
    this._setSelectedItem(target);
    if (target && (target.onDoubleClick || target.hasEventListener("dblclick"))) {
      evt = new createjs.MouseEvent("dblclick", o.x, o.y, target, e, -1, true, o.rawX, o.rawY);
      target.onDoubleClick && target.onDoubleClick(evt);
      target.dispatchEvent(evt);
    }
  };

  p.getObjectsUnderPointer2 = function(e) {
    var o = this._getPointerData(-1);
    var target = this._getObjectsUnderPoint(o.x, o.y, null, (this._mouseOverIntervalID ? 3 : 1));
    this._setSelectedItem(target);
    return target;
  };

  p._setSelectedItem = function(item) {
    if (item == null) {
      this.selectedItem = item;
      this.selectedClipPoint = false;
      return;
    }

    if (item.isClipPoint) {
      this.selectedClipPoint = true;
      return;
    }

    this.selectedItem = item;
  };

  p.selectedItem = null;
  p.selectedClipPoint = false;
}());
