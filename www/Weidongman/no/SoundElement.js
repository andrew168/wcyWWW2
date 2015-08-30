/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 */
TQ = TQ || {};

(function () {
  // 用法: 1) 拖入, 只有声音的 resource 名称,
  //       2) 从scene中读入, 是 JSON
  //  必须是用工厂生产这个元素, 因为, 是数据决定元素的类别.
  function SoundElement(level, jsonObj) {
    assertTrue(TQ.Dictionary.INVALID_PARAMETER, typeof jsonObj !='string'); // 用工厂提前转为JSON OBJ,而且, 填充好Gap
    this.level = level;
    this.children = [];
    this._isNewSkin = false;
    this.initialize(jsonObj);
  }

  SoundElement.srcToObj = function(src) {
    return ({type:"SOUND", src: src, isVis:1});
  };
  var p = SoundElement.prototype = new TQ.Element(null, null, null, null);
  p._parent_show = p.show;
  p.show = function(isVisible) {
    if (this.isSound()) {
      if (isVisible) this.play();
    else this.stop();
    } else {
      this._parent_show(isVisible);
    }
  };

  SoundElement.composeFFResource = function (res) {
    // ToDo: 大小写, 测试是否存在文件, 等等, 根据浏览器类别来给资源
    return SoundElement._composeFullPath(res.replace("mp3", "ogg"));
  };

  SoundElement.composeCMResource = function (res) {
    return SoundElement._composeFullPath(res.replace("wav", "mp3"));
  };

  // 只允许MP3和ogg, 其余的必须转变
  p._doLoad = function () {
    var id = this.jsonObj.src;
    var resForFF = SoundElement.composeFFResource(this.jsonObj.src);
    var resForCM = SoundElement.composeFFResource(this.jsonObj.src);
    assertTrue(TQ.Dictionary.INVALID_PARAMETER, this.isSound()); // 只用于声音元素
    TQ.SoundMgr.add(id, resForCM, resForFF);
    TQ.SoundMgr.start();  // ToDo: 只能加入一个声音
    this.displayObj = {};  // 必须要有, 以维护 element已有的 流程
    this.setTRSAVZ();
    this._afterItemLoaded();
  };

  p._parent_doAddItemToStage = p._doAddItemToStage;
  p._parent_doRemoveFromStage = p._doRemoveFromStage;
  p._doAddItemToStage = function()   // 子类中定义的同名函数, 会覆盖父类, 让所有的兄弟类, 都有使用此函数.
  {
    if (this.isSound()) {
      this.play();
    } else {
      this._parent_doAddItemToStage();
    }
  };

  SoundElement._composeFullPath = function (res) {
    if (res.indexOf(TQ.Config.SOUNDS_PATH) < 0) {
      return TQ.Config.SOUNDS_PATH + res;
    }

    return res;
  };

  p._doRemoveFromStage = function() {
    if (this.isSound()) {
      this.stop();
    } else {
      this._parent_doRemoveFromStage();
    }
  };

  p.play = function () {
    TQ.SoundMgr.play(this.jsonObj.src);
  };

  p.stop = function () {
    TQ.SoundMgr.stop(this.jsonObj.src);
  };

  TQ.SoundElement = SoundElement;
}());
