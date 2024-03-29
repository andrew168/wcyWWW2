/**
 * Created by Andrewz on 3/7/19.
 */

(function() {
  var p = createjs.Container.prototype;
  var selectBoxSize = 2;
  createjs.DisplayObject._hitTestCanvas.width = createjs.DisplayObject._hitTestCanvas.height = selectBoxSize;
  // 覆盖原函数
  p.setChildIndex = function(child, index) {
    var kids = this.children; var l = kids.length;
    if (child.parent !== this || index < 0 || index >= l) {
      return;
    }
    for (var i = 0; i < l; i++) {
      if (kids[i] === child) {
        break;
      }
    }
    if (i === l || i === index) {
      return;
    }
    kids.splice(i, 1);
    // if (index>i) { index--; }, 不需要, 因为正好要插入到index指定的位置, 绝对位置. 与kids中的内容没有关系
    kids.splice(index, 0, child);
  };

  /**
   * @method _testHitExt
   * @protected
   * @param {CanvasRenderingContext2D} ctx
   * @return {Boolean}
   **/
  p._testHitExt = function(ctx) {
    var hit = false;
    try {
      var pixels = ctx.getImageData(0, 0, selectBoxSize, selectBoxSize).data;
      for (var i = 3; i < pixels.length; i += 4) {
        if (pixels[i] > 1) {
          hit = true;
          break;
        }
      }
    } catch (e) {
      if (!DisplayObject.suppressCrossDomainErrors) {
        TQ.AssertExt.invalidLogic(0, "An error has occurred. This is most likely" +
          "due to security restrictions on reading canvas pixel data with local or cross-domain images.");
      }
    }
    return hit;
  };

  /**
   * @method _getObjectsUnderPoint
   * @param {Number} x
   * @param {Number} y
   * @param {Array} arr
   * @param {Number} mouseEvents A bitmask indicating which event types to look for.
   * Bit 1 specifies press & click & double click,
   * bit 2 specifies it should look for mouse over and mouse out.
   * This implementation may change.
   * @return {Array}
   * @protected
   **/
  p._getObjectsUnderPoint = function(x, y, arr, mouseEvents) {
    var ctx = createjs.DisplayObject._hitTestContext;
    var mtx = this._matrix;
    var hasHandler = this._hasMouseHandler(mouseEvents);
    // 移动到_hitTestContext之canvas的正中间
    x = x - selectBoxSize / 2;
    y = y - selectBoxSize / 2;

    // if we have a cache handy & this has a handler, we can use it to do a quick check.
    // we can't use the cache for screening children, because they might have hitArea set.
    if (!this.hitArea && this.cacheCanvas && hasHandler) {
      this.getConcatenatedMatrix(mtx);
      ctx.setTransform(mtx.a, mtx.b, mtx.c, mtx.d, mtx.tx - x, mtx.ty - y);
      ctx.globalAlpha = mtx.alpha;
      this.draw(ctx);
      if (this._testHitExt(ctx)) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, selectBoxSize + 1, selectBoxSize + 1);
        return this;
      }
    }

    // draw children one at a time, and check if we get a hit:
    var l = this.children.length;
    for (var i = l - 1; i >= 0; i--) {
      var child = this.children[i];
      var hitArea = child.hitArea;
      if (!child.visible || (!hitArea && !child.isVisible()) || (mouseEvents && !child.mouseEnabled)) {
        continue;
      }
      var childHasHandler = mouseEvents && child._hasMouseHandler(mouseEvents);

      // if a child container has a handler and a hitArea then we only need to check its hitArea, so we can treat it as a normal DO:
      if (child instanceof createjs.Container && !(hitArea && childHasHandler)) {
        var result;
        if (hasHandler) {
          // only concerned about the first hit, because this container is going to claim it anyway:
          result = child._getObjectsUnderPoint(x, y);
          if (result) {
            return this;
          }
        } else {
          result = child._getObjectsUnderPoint(x, y, arr, mouseEvents);
          if (!arr && result) {
            return result;
          }
        }
      } else if (!mouseEvents || hasHandler || childHasHandler) {
        child.getConcatenatedMatrix(mtx);

        if (hitArea) {
          mtx.appendTransform(hitArea.x, hitArea.y, hitArea.scaleX, hitArea.scaleY, hitArea.rotation, hitArea.skewX, hitArea.skewY, hitArea.regX, hitArea.regY);
          mtx.alpha = hitArea.alpha;
        }

        ctx.globalAlpha = mtx.alpha;
        ctx.setTransform(mtx.a, mtx.b, mtx.c, mtx.d, mtx.tx - x, mtx.ty - y);
        (hitArea || child).draw(ctx);
        if (!this._testHitExt(ctx)) {
          continue;
        }
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, selectBoxSize + 1, selectBoxSize + 1);
        if (hasHandler) {
          return this;
        } else if (arr) {
          arr.push(child);
        } else {
          return child;
        }
      }
    }
    return null;
  };
}());
