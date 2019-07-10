/**
 * Created by Andrewz on 3/7/19.
 */

(function () {
  var p = createjs.Container.prototype;
  // 覆盖原函数
  p.setChildIndex = function (child, index) {
    var kids = this.children, l = kids.length;
    if (child.parent != this || index < 0 || index >= l) {
      return;
    }
    for (var i = 0; i < l; i++) {
      if (kids[i] == child) {
        break;
      }
    }
    if (i == l || i == index) {
      return;
    }
    kids.splice(i, 1);
    // if (index>i) { index--; }, 不需要, 因为正好要插入到index指定的位置, 绝对位置. 与kids中的内容没有关系
    kids.splice(index, 0, child);
  };


  /**
   * @method _testHit
   * @protected
   * @param {CanvasRenderingContext2D} ctx
   * @return {Boolean}
   **/
  p._testHit = function (ctx) {
    try {
      var hit = ctx.getImageData(0, 0, 1, 1).data[3] > 1;
    } catch (e) {
      if (!DisplayObject.suppressCrossDomainErrors) {
        throw "An error has occurred. This is most likely due to security restrictions on reading canvas pixel data with local or cross-domain images.";
      }
    }
    return hit;
  }


  /**
   * @method _getObjectsUnderPoint
   * @param {Number} x
   * @param {Number} y
   * @param {Array} arr
   * @param {Number} mouseEvents A bitmask indicating which event types to look for. Bit 1 specifies press &
   * click & double click, bit 2 specifies it should look for mouse over and mouse out. This implementation may change.
   * @return {Array}
   * @protected
   **/
  p._getObjectsUnderPoint = function (x, y, arr, mouseEvents) {
    var ctx = createjs.DisplayObject._hitTestContext;
    var mtx = this._matrix;
    var hasHandler = this._hasMouseHandler(mouseEvents);

    // if we have a cache handy & this has a handler, we can use it to do a quick check.
    // we can't use the cache for screening children, because they might have hitArea set.
    if (!this.hitArea && this.cacheCanvas && hasHandler) {
      this.getConcatenatedMatrix(mtx);
      ctx.setTransform(mtx.a, mtx.b, mtx.c, mtx.d, mtx.tx - x, mtx.ty - y);
      ctx.globalAlpha = mtx.alpha;
      this.draw(ctx);
      if (this._testHit(ctx)) {
        ctx.setTransform(1, 0, 0, 1, 0, 0)
        ctx.clearRect(0, 0, 2, 2);
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
      if (child instanceof Container && !(hitArea && childHasHandler)) {
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
        if (!this._testHit(ctx)) {
          continue;
        }
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, 2, 2);
        if (hasHandler) {
          return this;
        }
        else if (arr) {
          arr.push(child);
        }
        else {
          return child;
        }
      }
    }
    return null;
  };

}());
