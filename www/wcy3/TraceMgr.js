/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 */
window.TQ = window.TQ || {};
(function() {
  /**
   * TraceMgr, 负责Trace的增删改查/显示/Fixup/Save/Open等操作,
   * * 只显示当前Level的 trace, 不显示其余level的.
   * * 任何一个物体都可以显示Trace, 或者不显示. (但是整体的, 不能指定显示A到B时间段的Trace)
   * * 任何一个子物体, 都可以.
   * * 不保存到Scene文件, 而是临时生成的
   * * 它的目的是查看运动轨迹, 便于修改; 不同于: 按照预设轨迹的运动, 先绘制路径, 再按照轨迹来运动.
   * @class TraceMgr
   * @static
   **/
  var TraceMgr = function() {
    throw "TraceMgr cannot be instantiated";
  };

  TraceMgr.initialize = function() {
  };

  TraceMgr.addVertexKeyPressed = false;
  TraceMgr.addNewPosition = function(ele) {
    var pDevice = TQ.Utility.worldToDevioce(ele.jsonObj.x, ele.jsonObj.y);
    if (!ele.trace) {
      TQ.InputMap.registerAction(TQ.InputMap.ADD_VERTEX, function() {
        TraceMgr.addVertexKeyPressed = true;
      });
      ele.trace = new Trace("#0000FF", 2);
    }
    if (TraceMgr.addVertexKeyPressed) {
      TraceMgr.addVertexKeyPressed = false;
      ele.trace.add(pDevice);
    } else if (ele.trace.isEmpty()) {
      ele.trace.add(pDevice);
      ele.trace.add(pDevice);
    } else {
      ele.trace.update(pDevice);
    }
  };

  TraceMgr.delete = function(ele) {
    if (!ele.trace) return;
    ele.trace.removeFromStage();
    ele.trace = null;
  };

  // Trace 类
  var Trace = function(color, thickness) {
    this.color = color;
    this.thickness = thickness;

    this.lastPt = null;
    this.points = [];
  };

  Trace.prototype.updateShape = function() {
  };

  Trace.prototype.update = function(pDevice) {
    if (this.points.length > 0) {
      this.points.pop(); // 先丢弃旧的临时点，再记录新的临时点
    }
    this.add(pDevice);
    this.draw();
  };

  Trace.prototype.isEmpty = function() {
    return (this.points.length == 0);
  };

  Trace.prototype.add = function(pDevice) {
    this.points.push(pDevice);
  };

  Trace.prototype.draw = function() {
    if (this.shape) {
      this.removeFromStage();
      this.shape = null;
      this.graphics = null;
    }
    this.shape = new createjs.Shape();
    this.addToStage();
    this.shape.x = 0;
    this.graphics = this.shape.graphics;
    this.graphics.setStrokeStyle(this.thickness, "round", null, null).beginStroke(this.color);
    this.shape.uncache();

    var len = this.points.length;
    var i = 0;
    if (len > 1) {
      this.graphics.moveTo(this.points[0].x, this.points[0].y);
      for (i = 0; i < len; i++) {
        this.graphics.lineTo(this.points[i].x, this.points[i].y);
      }
    }
  };

  Trace.prototype.addToStage = function() {
    stageContainer.addChild(this.shape);
  };

  Trace.prototype.removeFromStage = function() {
    stageContainer.removeChild(this.shape);
  };

  Trace.prototype.destory = function() {
    stageContainer.removeChild(this.shape);
    this.shape = null;
    this.graphics = null;
  };

  Trace.prototype.toJSON = function() {
    return { color: this.color, thickness: this.thickness, points: this.points };
  };

  // static 函数
  Trace.build = function(desc) {
    if (!desc.points) {
      return null;
    }

    var trace = new Trace(desc.color, desc.thickness);
    for (var i = 0; i < desc.points.length; i++) {
      trace.add(desc.points[i]);
    }
    desc.points = null;

    return trace;
  };

  TQ.TraceMgr = TraceMgr;
  TQ.Trace = Trace;
}());
