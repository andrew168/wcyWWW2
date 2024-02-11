/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 */
window.TQ = window.TQ || {};

// 存放全局的API， 需要在所有模块都调入之后， 才能够执行， 否则没有函数。
(function() {
  function WCY() {

  }
  WCY.isPlayOnly = true;
  WCY.currentScene = null;
  WCY.getCurrentScene = function() {
    return WCY.currentScene;
  };

  WCY.getCurrentElement = function() {
    return TQ.SelectSet.peek();
  };

  /*
    直接跳转到第id个场景 (id >=0)
     */
  WCY.gotoLevel = function(id) {
    id = Number(id);
    assertNotNull(TQ.Dictionary.FoundNull, WCY.currentScene); // 必须在微创意显示之后使用
    if (!WCY.currentScene) return;
    WCY.currentScene.gotoLevel(id);
  };

  /*
     插入第id(id >=0）个场景， 如果该位置已经有场景， 把原来的场景向后顺延。
     如果id < 0, 则令id =0;.
     如果id 超出上边界， 则自动在末尾添加一个场景）
     */
  WCY.addLevelAt = function(id) {
    id = Number(id);
    assertNotNull(TQ.Dictionary.FoundNull, WCY.currentScene); // 必须在微创意显示之后使用
    if (!WCY.currentScene) return;

    WCY.currentScene.addLevel(id);
  };

  /*
     紧跟当前场景的后面，插入1个新场景。
     */
  WCY.addLevel = function() {
    assertNotNull(TQ.Dictionary.FoundNull, WCY.currentScene); // 必须在微创意显示之后使用
    if (!WCY.currentScene) return;
    WCY.currentScene.addLevel(WCY.currentScene.currentLevelId + 1);
  };

  /*
     删除第id(id >=0）个场景， 并且把此后的场景前移。
     如果id超出边界（id < 0)，则忽略
     */
  WCY.deleteLevel = function(id) {
    id = Number(id);
    assertNotNull(TQ.Dictionary.FoundNull, WCY.currentScene); // 必须在微创意显示之后使用
    if (!WCY.currentScene) return;

    WCY.currentScene.deleteLevel(id);
  };

  /*
     移动序号为srcId的场景，并插入到序号dstId的场景之前，
     注意：srcId和dstId都是在执行此函数之前， 按照场景的顺序来编号的。
     用户不需要关心
     */
  WCY.moveTo = function(srcId, dstId) {
    srcId = Number(srcId);
    dstId = Number(dstId);
    assertNotNull(TQ.Dictionary.FoundNull, WCY.currentScene); // 必须在微创意显示之后使用
    if (!WCY.currentScene) return;

    WCY.currentScene.moveTo(srcId, dstId);
  };

  /*
     复制序号为srcId的场景的内容，并插入到序号dstId的场景之前，
     */
  WCY.copyTo = function(srcId, dstId) {
    srcId = Number(srcId);
    dstId = Number(dstId);
    assertNotNull(TQ.Dictionary.FoundNull, WCY.currentScene); // 必须在微创意显示之后使用
    if (!WCY.currentScene) return;

    WCY.currentScene.copyTo(srcId, dstId);
  };

  /*
    获取当前微创意的场景（Level）数量
    */
  WCY.getLevelNum = function() {
    assertNotNull(TQ.Dictionary.FoundNull, WCY.currentScene); // 必须在微创意显示之后使用
    if (!WCY.currentScene) return 0;
    return WCY.currentScene.levelNum();
  };

  WCY.doStop = function() {
    assertTrue(TQ.Dictionary.INVALID_LOGIC, WCY.currentScene != null);
    if (WCY.currentScene != null) {
      WCY.currentScene.stop();
    }
  };
  WCY.doPlay = function() {
    assertTrue(TQ.Dictionary.INVALID_LOGIC, WCY.currentScene != null);
    if (WCY.currentScene != null) {
      WCY.currentScene.play();
    }
  };
  WCY.emptyScene = function() { TQ.SceneEditor.emptyScene(); };

  WCY.doPlayStop = function() {
    if (TQ.FrameCounter.isPlaying()) {
      WCY.doStop();
    } else {
      WCY.doPlay();
    }
  };

  var canvas;
  // 进入/退出 全屏模式
  WCY.fullscreenPlay = function(width, height) { // 屏幕分辨率的大小
    canvas = TQ.Graphics.getCanvas();
    canvas.width = Math.round(width);
    canvas.height = Math.round(height);

    TQ.Config.zoomX = width / TQ.Config.workingRegionWidth;
    TQ.Config.zoomY = height / TQ.Config.workingRegionHeight;
    TQ.Config.workingRegionWidth = width;
    TQ.Config.workingRegionHeight = height;
    WCY.doPlay();
  };

  WCY.eixtFullscreen = function() {
    TQ.Graphics.setCanvas();
    TQ.Config.zoomX = TQ.Config.zoomY = 1;
  };

  WCY.deleteElement = function(ele) {
    WCY.currentScene.deleteElement(ele);
  };

  WCY.getCurrentLevelId = function() {
    return WCY.currentScene.currentLevelId;
  };

  WCY.getCurrentTime = function() {
    return TQ.FrameCounter.t();
  };

  // size: 雪花大小，  默认1,  取值范围1-5.
  // direction:  落雪方向： 0：向下， 取值范围： -15度到15度，
  // density: 密度， 默认1（小雨）取值范围：1-10
  WCY.snow = function(size, direction, density, res, snowFlowerImage) {

  };

  WCY.snowChange = function(size, direction, density) {

  };

  WCY.snowStop = function() {
    TQ.SnowEffect.stop();
  };

  // size: 雨滴大小，  默认1,  取值范围1-5.
  // direction: 落雨方向： 0：向下， 取值范围： -15度到15度，
  // density: 密度， 默认1（小雨），取值范围：1-10
  WCY.rain = function(size, direction, density, res, dropImage) {
    TQ.RainEffect.set(size, direction, density, res, dropImage);
  };

  WCY.rainChange = function(size, direction, density) {
    TQ.RainEffect.set(size, direction, density);
  };

  WCY.rainStop = function() {
    TQ.RainEffect.stop();
  };

  // type: 烟火的种类，默认1,      系统保留扩展其它取值）
  WCY.firework = function(type) {
    TQ.Log.debugInfo(type);
  };

  // ------------- 以下的函数用于配置系统参数 -------------------------
  // 设置零件标志的大小， 默认是10：
  WCY.setMarkerSize = function(radius) {
    TQ.Marker.RADIUS = radius;
  };

  TQ.WCY = WCY;
}());
