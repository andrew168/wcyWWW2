/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 */
window.TQ = window.TQ || {};

(function () {
  function Element(level, desc) {
    if (level != null ) {  // 适用于 子类的定义, 不做任何初始化,只需要prototype
      this.level = level;
      this.children = [];
      this.decorations = null;
      this._isNewSkin = false;
      this._isHighlighting = false;
      this.initialize(desc);
    }
  }
  Element.IN_STAGE = 0x01; // 加入到了Stage;
  Element.JOINTED = 0x02;     // 关节体中的所有子物体,不包括根关节自己.
  Element.BROKEN = 0x10; // 相对运动: 子物体可以独立运动,也随父物体移动(布局用).绝对运动: 只能整体运动, 或者IK运动.

  // 以下是操作, 对应于唯一的动画track
  Element.TRANSLATING = 0x20; // 被操作之后, 马上值为真, 以便于拍摄记录
  Element.ROTATING = 0x40;
  Element.SCALING = 0x80;
  Element.ALPHAING = 0x100;
  Element.ZING = 0x200;
  Element.VISIBLE_CHANGED = 0x400;
  Element.TO_RELATIVE_POSE = (Element.TRANSLATING | Element.ROTATING | Element.SCALING
        | Element.ZING | Element.ALPHAING);  //  在组成Group, Joint, 显示 Pivot Marker的时候需要.
  Element.CLEAR_ANIMATATION = 0x8000; //清除全部track, 重新记录;

  Element.showHidenObjectFlag = false;  //  个人的state由个人记录, 上级可以控制
  var p = Element.prototype;
  p.jsonObj = null;
  p.displayObj = null;
  p.parent = null;
  p.children = [];  //  注意： 缺省是空数组， 不是null， 确保每一个参数都有缺省值！！！
  p.animeTrack = {}; // 只是数组指针, 和jsonObj 共用数据, 没有重复

  p.show = function(isVisible) {
    if (this.displayObj == undefined ) return;
    this.jsonObj.isVis = isVisible;
    if (this.jsonObj.isVis && !this.hasFlag(Element.IN_STAGE)) {
      TQ.Log.out(TQ.Dictionary.INVALID_LOGIC); // show + _doAddItemToStage 飞线, 适用于: 1) load之时不可见的元素, 2) marker初次创建时, 不可见
      TQ.StageBuffer.add(this);
    }
    //ToDo: 留给显示函数做, 不能一竿子插到底,  this.displayObj.visible = isVisible;
    this.dirty2 = true;
    this.setFlag(Element.VISIBLE_CHANGED);

    // 传遍所有孩子
    if (this.children) {
      for (var i=0; i < this.children.length; i++) {
        this.children[i].show(isVisible);
      }
    }
  };

  // Add image item
  p.initialize = function (desc) {
    this.dirty = false;
    this.dirty2 = false;  // 仅当需要在game循环之外调用element.update强制"拍摄"的时候令它为true
    desc.x = (desc.x == null) ? 0: desc.x;
    desc.y = (desc.y == null) ? 0: desc.y;
    switch (desc.type) {
      case "GroupFile" : return this._addComponent(desc);
      case "Text" : return this.load(desc);
      case "Group" : return this.load(desc);
      case "Bitmap": return this.load(desc);
      case "BitmapAnimation": return this._addActorByUrl(desc, null);
      default:
        return this.load(desc);
    }

    /// assertTrue("错误的元素信息: " + JSON.stringify(itemURL), false);
    return null;
  };

  p._addComponent = function (jsonFiledesc) {
    this.children = [];
    // 调入 json文件, 取其中的 elements
    (function (pt) {
      netOpen(jsonFiledesc.src, function (jqResponse) {
        try {
          var desc = JSON.parse(jqResponse);
        } catch (e) {
          displayInfo2(jqResponse);
          TQ.Log.error(jqResponse + ". "+ e.toString());
          // 给一个空白文件， 确保可可持续进行
          desc = TQ.Utility.getEmptyScene();
        }

        desc = pt._extractComponent(desc, jsonFiledesc.x, jsonFiledesc.y, jsonFiledesc.zIndex);
        pt.initialize(desc);
      });
    })(this);
  };

  p._loadComponent = function () {
    assertNotNull(TQ.Dictionary.FoundNull, this.jsonObj); // 合并
    // 建立空的 displayObj 以容纳设备空间的参数
    this.displayObj = {};
    this.setTRSAVZ();
    this._afterItemLoaded();
  };

  Element.liftZ = function(jsonObj, zBase) {
    if (jsonObj.zIndex != -1) { // Group物体的zIndex，总是-1
      jsonObj.zIndex += zBase;
    }
    if (jsonObj.children) {
      for (var i=0; i< jsonObj.children.length; i++) {
        Element.liftZ(jsonObj.children[i], zBase);
      }
    }
  };

  p._extractComponent = function (objJson, x, y, zMax) {
    if (!this.jsonObj) {
      this.jsonObj = {};
    }

    if (!this.jsonObj.children) {
      this.jsonObj.children = [];
    }

    // 选取 元件中的所有元素, 作为当前元素的子元素, 如果有多个level, 则合并到一个Level
    for (var i = 0; i < objJson.levels.length; i++) {
      var level = objJson.levels[i];
      if ((level.elements != null ) && (level.elements.length > 0)) {
        for (var j = 0; j < level.elements.length; j++) {
          // 元件的zIndex要升高，使他置于top，可见
          Element.liftZ(level.elements[j], zMax);
          this.jsonObj.children.push(level.elements[j]);
        }
      }
    }

    if (this.jsonObj.children.length == 1) { //  只有一个物体,  不用建立组
      var temp = this.jsonObj.children[0];
      this.jsonObj.children = null;
      this.jsonObj = temp;
      this.jsonObj.animeTrack = null; // 消除元件包的基础动画
    } else {
      this.jsonObj.type = "Group";  // 多个物体,需要建立虚拟物体, group
    }
    this.jsonObj.x = x;
    this.jsonObj.y = y;
    this.jsonObj.zIndex = zMax;
    return this.jsonObj;
  };

  p._addActorByUrl = function (desc, alias) {
    // 先读入Description文件， 再读入图像。
    var request = new XMLHttpRequest();
    console.info('Requesting ' + desc.src);
    request.open("GET", desc.src);

    (function (parentObj) {
      request.onreadystatechange = function () {
        if (request.readyState == 4) {
          if (request.status == 404) {
            console.info(desc.src + ' does not exist');
          }
          else {
            var o = JSON.parse(request.responseText);
            o.alias = (alias == null) ? 'none' : alias;
            o.remote = true;
            if (!o.type) {
              o.type = "BitmapAnimation";
            }
            o.x = (o.x == undefined) ? desc.x : o.x;
            o.y = (o.y == undefined) ? desc.y : o.y;
            o.PivotX = (o.PivotX == undefined) ? TQ.Config.pivotX : o.PivotX;
            o.PivotY = (o.PivotY == undefined) ? TQ.Config.pivotY : o.PivotY;
            parentObj.load(o);
          }
        }
      };
    })(this);
    request.send();
  };

  // 补全所缺少的数据
  p.fillGap = function(desc) {
    // 所有元素， 在add之后， 都需要经过load， 从资源中调进来。
    if (!desc.type) {
      desc.type = "Bitmap";
    }

    if (!desc.state) {
      desc.state = 0;
    }

    if (!desc.isVis) {
      desc.isVis = true;
    }

    if (!desc.isClipPoint) {
      desc.isClipPoint = false;
    }

    if (!desc.x) {
      desc.x = 100;
    }

    if (!desc.y) {
      desc.y = 200;
    }

    if (!desc.zIndex) { desc.zIndex = 0;}
    if (desc.type == "Text") {
      desc.pivotX = (desc.pivotX == undefined) ? TQ.Config.TEXT_PIVOT_X : desc.pivotX;
      desc.pivotY = (desc.pivotY == undefined) ? TQ.Config.TEXT_PIVOT_Y : desc.pivotY;
      if  (desc.font) { this.upgradeFont(desc);}
      if (!desc.fontFace)  desc.fontFace = TQ.Config.fontFace;
      if (!desc.fontSize)  desc.fontSize = TQ.Config.fontSize;
      if (!desc.color)  desc.color = TQ.Config.color;
    } else {
      desc.pivotX = (desc.pivotX == undefined) ? TQ.Config.pivotX : desc.pivotX;
      desc.pivotY = (desc.pivotY == undefined) ? TQ.Config.pivotY : desc.pivotY;
    }

    if (!desc.sx) {
      desc.sx = 1;
    }

    if (!desc.sy) {
      desc.sy = 1;
    }

    if (!desc.rotation) {
      desc.rotation = 0;
    }

    // 清除M和IM, 过去的版本中,可能输出了这些数值.
    // 他们如果没有 对象化, 就会阻碍 Matrix.multiply()
    desc.IM = desc.M = null;

    // 强制补全动画轨迹, 应为这是存放物体坐标的地方.!!! 2013-3-1
    desc.animeTrack = new TQ.AnimeTrack(desc);
    TQ.AnimeTrack.validate(desc.animeTrack);
    return desc;
  };

  p.load = function (desc) {
    // 记录到element中
    this.jsonObj = this.fillGap(desc);
    if ((this.jsonObj.src != undefined) && (this.jsonObj.src != null)) {
      this.jsonObj.src = Element.upgrade(this.jsonObj.src);
    }

    switch (desc.type) {
      case "BitmapAnimation":
        this._loadActor();
        break;
      case "Text":
        this._loadText();
        break;
      case "Group":
        this._loadComponent();
        break;
      case "JointMarker": this._loadMarker();
        break;
      case "SOUND":
        this._doLoad();
        break;
      case "Bitmap":
      default :
        this._loadImage();
        break;
    }

    if (desc.trace) {
      this.trace = TQ.Trace.build(desc.trace);
    }

    this.setupChildren();
    return desc;
  };

  p.setupChildren = function() {
    if (!(!this.jsonObj.children)) {
      for (var i = 0; i < this.jsonObj.children.length; i++) {
        this.addChild(this.jsonObj.children[i]);
      }
    }
  };

  p.findChild = function (childDisplayObj) {
    if (this.children == null) {
      return null;
    }

    var result = null;
    for (var i = 0; i < this.children.length; i++) {
      if (this.children[i].displayObj.id == childDisplayObj.id) {
        return this.children[i];
      }

      result = this.children[i].findChild(childDisplayObj);
      if (result != null) break;
    }

    return result;
  };

  p.addJoint = function(ele) {
    assertTrue(TQ.Dictionary.INVALID_LOGIC, TQ.InputCtrl.inSubobjectMode); //在零件模式下
    if (ele.jsonObj.state == undefined ) {
      ele.jsonObj.state = 0;
    }

    ele.jsonObj.state |= Element.JOINTED;
    this.addChild(ele);
    this.dirty2 = true;
  };

  p.addChild = function(desc) {
    if (desc.displayObj != null) { // 在group或者joint物体的时候,出现
      var child = desc; // 已经是物体了, 不用创建了. 但是,需要衔接jsonObj
      //从世界坐标, 变换到父物体坐标系: 由Update来做
      var t = TQ.FrameCounter.t();
      child.update(t);
      var p = {};
      p.t = t;
      Element.copyWorldData(p, child.jsonObj);
      var worldData = [];
      this.saveWorldDataAll(worldData, child);
      child.parent = this;
      child.animeTrack = null;
      this.children.push(child);
      this.toRelative(worldData, child);
      Element.copyWorldData(child.jsonObj, p);
      if (!this.jsonObj.children) {
        this.jsonObj.children = [];
      }
      this.jsonObj.children.push(child.jsonObj);

      child.dirty2 = this.dirty2 = this.dirty = true;  // 迫使系统更新child的位置数据位相对坐标
      child.setFlag(Element.TO_RELATIVE_POSE);

    } else {
      child = new Element(this.level, desc);
      child.parent = this;
      if (!this.children) {
        this.children = [];
      }
      this.children.push(child);
    }
    return child;
  };

  Element.copyWorldData = function(a, b) {
    a.x = b.x;
    a.y = b.y;
    a.sx = b.sx;
    a.sy = b.sy;
    a.rotation = b.rotation;
    a.visible = b.visible;
  };

  p.saveWorldDataAll = function(worldData, child) {
    // 计算当前的世界坐标，并且保存,并且记录轨道的类别
    if (child.animeTrack.x) child.saveWorldData(worldData, child.animeTrack.x, Element.TRANSLATING);
    if (child.animeTrack.sx) child.saveWorldData(worldData, child.animeTrack.sx, Element.SCALING);
    if (child.animeTrack.rotation) child.saveWorldData(worldData, child.animeTrack.rotation, Element.ROTATING);
    if (child.animeTrack.visible) child.saveWorldData(worldData, child.animeTrack.visible, Element.VISIBLE_CHANGED);
  };

  p.toRelative = function(worldData, child) {
    // 计算相对坐标， 并且录制。
    for (var i = 0; i < worldData.length; i++) {
      var p = worldData[i];
      child.dirty2 = this.dirty2 = this.dirty = true;  // 迫使系统更新child的位置数据位相对坐标
      child.setFlag(p.type);
      Element.copyWorldData(child.jsonObj, p);
      this.update(p.t);
    }
  };

  p.saveWorldData = function(worldData, track, type) {
    //ToDo: 先计算所有parent的pose，再计算它的pose
    for (var i=0; i < track.t.length; i++) {
      var t = track.t[i];
      this.update(t);
      var p = {};
      p.t = t;
      p.type = type;
      Element.copyWorldData(p, this.jsonObj);
      worldData.push(p);
    }
  };

  p.removeChild = function (child) {
    assertNotNull(TQ.Dictionary.FoundNull, this.children); // "应该有孩子"
    var id = this.children.indexOf(child);
    assertTrue(TQ.Dictionary.INVALID_LOGIC, id >= 0); //"应该能够找到孩子"
    if (id >= 0) {
      child = (this.children.splice(id, 1))[0];
      id = this.jsonObj.children.indexOf(child.jsonObj);
      this.jsonObj.children.splice(id, 1);
      child.parent = null;
    }

    //迫使元素回到世界坐标系标示
    child.dirty2 = this.dirty2 = this.dirty = true;  // 迫使系统更新child的位置数据位相对坐标
    child.setFlag(Element.TO_RELATIVE_POSE);
    var t = TQ.FrameCounter.t();
    child.update(t);
    return child;
  };

  p.atomNum = function() {
    var sum = 1;
    for (var i = 0; i < this.children.length; i++) {
      sum += this.children[i].atomNum();
    }
    return sum;
  };

  p.skinning = function(skin) {
    // 暂存 Z可见性 和 新皮肤的名称,
    this.persist();
    this.jsonObj.src = skin.jsonObj.src;
    this.deleteDisplayObj();
    this._isNewSkin = true;
    this._loadImage();
    skin.TBD = true;
  };

  p.attachDecoration = function(decs) {
    this.decorations = decs;
    // ToDo: 处理每一个Marker
    var marker = this.decorations[0];
    marker.host = this;
    marker.level = this.level;
    marker.attach();
    this.updateHighlighter(marker.displayObj);
    this.dirty2 = marker.dirty2 = true;
    marker.setFlag(Element.TO_RELATIVE_POSE | Element.CLEAR_ANIMATATION); // 迫使他记录所有的track,
    this.addChild(marker);
    marker.show(true);
    marker.moveToTop();
  };

  p.detachDecoration = function() {
    if (!this.decorations) {return null;}
    var decorations  = this.decorations;
    this.decorations = null;
    assertNotNull(TQ.Dictionary.FoundNull, decorations);
    for (var i=0; i < decorations.length; i++) {
      var marker = decorations[i];
      marker.show(false);
      marker.displayObj.visible = false;
      marker.host = null;
      marker.level = null;
      this.removeChild(marker);
    }
    return decorations;
  };

  p.moveToTop = function() {
    var id = stage.getNumChildren();
    stage.setChildIndex(this.displayObj, id - 1);
  };

  p._loadImage = function () {
    assertNotNull(TQ.Dictionary.FoundNull, this.jsonObj); //合并jsonObj
    var jsonObj = this.jsonObj;
    var img3 = new Image();   // 由他调入图像资源！！

    (function (pt) {
      img3.onload = function () {
        // 创建Bitmap
        pt.displayObj = new createjs.Bitmap(jsonObj.img);
        jsonObj.img = null;
        pt.setTRSAVZ();
        pt._afterItemLoaded();
      }
    })(this);

    // 为了在callback中引用父容器，临时增加一个属性， 记录当前class的指针，
    // img3.obj = jsonObj;
    img3.src = jsonObj.src;
    jsonObj.img = img3;
  };

  p.setTRSAVZ = function () {
    var jsonObj = this.jsonObj;
    assertNotNull(TQ.Dictionary.FoundNull, this.jsonObj); //"世界坐标值jsonOb不能为空"
    assertNotNull(TQ.Dictionary.FoundNull, this.displayObj); //"显示对象displayObj不能为空"
    if (jsonObj.isVis && !this.isVirtualObject() && !this.hasFlag(Element.IN_STAGE)) {
      TQ.Log.out(TQ.Dictionary.INVALID_LOGIC + this.jsonObj.src); //飞线: 谁在使用这种情况?, 顶多在Show的时候检查"
      // this._doAddItemToStage();
    }
    this.displayObj.visible = jsonObj.isVis || Element.showHidenObjectFlag;
    this.displayObj.scaleX = jsonObj.sx;
    this.displayObj.scaleY = jsonObj.sy;

    this.toDeviceCoord(this.displayObj, this.jsonObj);
  };

  p.toDeviceCoord = function(displayObj, jsonObj)
  {
    assertValid(TQ.Dictionary.FoundNull, displayObj); // "应有显示数据
    assertValid(TQ.Dictionary.FoundNull, jsonObj); // 应有显示数据
    //从 用户使用的世界坐标和物体坐标，转换为可以绘制用的设备坐标
    displayObj.x =  jsonObj.x;
    displayObj.y = TQ.Utility.toDeviceCoord(jsonObj.y);
    if (this.isMarker() || this.isSound()) { // marker 永远是一样的大小, 圆的, 没有旋转, 定位在圆心.
      displayObj.scaleX = displayObj.scaleY = 1;
      displayObj.regX = displayObj.regY = 0;
      displayObj.rotation = 0;
      return;
    }
    if (!(this.isVirtualObject() || this.isMarker())) {
      displayObj.regX = jsonObj.pivotX * displayObj.getWidth(true);
      displayObj.regY = TQ.Utility.toDevicePivot(jsonObj.pivotY) * displayObj.getHeight(true);
    } else {
      displayObj.regX = 0;
      displayObj.regY = 0
    }

    displayObj.rotation = TQ.Utility.toDeviceRotation(jsonObj.rotation);
    displayObj.scaleX = jsonObj.sx;
    displayObj.scaleY = jsonObj.sy;
  };

  p._loadActor = function () {
    assertNotNull(TQ.Dictionary.FoundNull, this.jsonObj); //合并jsonObj
    var spriteSheet = this.jsonObj;
    // 这里应该再有一个callback， 因为动画的图像需要花时间调入
    var ss = new createjs.SpriteSheet(spriteSheet);
    var anima = new createjs.Sprite(ss);

    // Set up looping
    ss.getAnimation("run").next = "run";
    ss.getAnimation("jump").next = "run";
    anima.gotoAndPlay("jump");
    this.displayObj = anima;
    this.setTRSAVZ();
    this._afterItemLoaded();
  };

  p._loadText = function () {
    assertNotNull(TQ.Dictionary.FoundNull, this.jsonObj); // 合并jsonObj
    var jsonObj = this.jsonObj;
    var txt = new createjs.Text(jsonObj.text, TQ.Utility.toCssFont(jsonObj.fontSize, jsonObj.fontFace), jsonObj.color);
    if (jsonObj.textAlign == null) {
      txt.textAlign = jsonObj.textAlign;
    } else {
      txt.textAlign = "left";
    }
    this.displayObj = txt;
    this.setTRSAVZ();
    this._afterItemLoaded();
  };

  p.removeFromStage = function () {
    this._doRemoveFromStage();
    for (var i = 0; i < this.children.length; i++) {
      var child = this.children[i];
      child.removeFromStage();
    }
  };

  p._doRemoveFromStage = function() {
    TQ.TraceMgr.removeFromStage(this);
    stage.removeChild(this.displayObj);
    this.clearFlag(Element.IN_STAGE);
  };

  p.persist = function() {
    // 记录当前数据到 json, 以便于存盘和再次切入该场景
    if (!this.jsonObj) { return; }
    if (!this.displayObj) {
      this.jsonObj.zIndex = -1;
    } else {
      this.jsonObj.zIndex = stage.getChildIndex(this.displayObj);
    }
    for (var i = 0; i < this.children.length; i++) {
      this.children[i].persist();
    }
  };

  p.destroy = function () {
    if (this.children != null) {
      for (var i = 0; i < this.children.length; i++) {
        this.children[i].destroy();
      }
    }

    this.deleteDisplayObj();
    // 切断联系,以方便系统收回内存资源
    this.children = null;
    this.jsonObj = null;
    this.animeTrack = null;
  };

  p.deleteDisplayObj = function () {
    // 从stage中移除当前的 皮肤,(不再显示),
    // 同时,重置回调函数,阻止用户操作; 切断指针以便于释放内容,
    this._doRemoveFromStage();
    if (this.displayObj != null) {
      this.displayObj.jsobObj = null;
      this.displayObj.onPress = null;
      this.displayObj.onMouseOver = null;
      this.displayObj.onMouseOut = null;
      this.displayObj = null;
    }
  };

  p.eraseAnimeTrack = function () {
    if (this.children != null) {
      for (var i = 0; i < this.children.length; i++) {
        this.children[i].eraseAnimeTrack();
      }
    }

    TQ.TrackRecorder.erase(this);
  };

  p.deleteChild = function (ele) {
    if (this.children == null) {
      return false;
    }

    for (var i = 0; i < this.children.length; i++) {
      if (this.children[i] == ele) {
        this.children[i].destroy();
        this.children.splice(i, 1);
        this.jsonObj.children.splice(i,1);
        return true;
      }

      if  (this.children[i].deleteChild(ele) == true) return true;
    }

    return false;
  };

  p.addItemToStage = function () {
    TQ.StageBuffer.add(this);
    if (this.children != null) {
      for (var i = 0; i < this.children.length; i++) {
        var child = this.children[i];
        child.addItemToStage();
      }
    }
  };

  p._doAddItemToStage = function (upperEle) {
    // 只需要加入一次， 之后， 都是自动更新坐标，角度等等， 不需要反复加入
    // 他们的坐标都控制在 displayObj中，
    if (( null == this.displayObj) || this.isVirtualObject()) { // group物体的虚根
      return;
    }

    if (this.jsonObj.zIndex == -1) {
      assertTrue(TQ.Dictionary.INVALID_LOGIC, false); // -1, group物体应该在isVirtualObject中处理
    }
    var thislevel = this.level;
    var item = this.displayObj;
    assertNotNull(TQ.Dictionary.FoundNull, this.displayObj); // 必须有显示体
    item.jsonObj = this.jsonObj;  // 需要临时建立关系， 因为在NetIO时候可能破坏了。
    if ((this.jsonObj.isVis === undefined) || (this.jsonObj.isVis == true)) {
      this.setFlag(Element.IN_STAGE);
      if ((!upperEle) || (!upperEle.displayObj)) { // 没有在我之上的， 我就是top
        stage.addChild(item);
      } else {
        var z = stage.getChildIndex(upperEle.displayObj);
        z = TQ.MathExt.range(z, 0, stage.getNumChildren()); 
        stage.addChildAt(item, z);  // 把upperEle 顶起来
      }

      if (this.trace) {
        this.trace.addToStage();
      }

      // wrapper function to provide scope for the event handlers:
      (function (ele) {
        item.onPress = function (evt) {
          if (ele.isGrouped() && !TQ.InputCtrl.inSubobjectMode && !ele.isJoint()) {
            // 是Group的物体, 而且没有打散, 则操作其根
            var ele2 = ele.getEditableElement();
          } else {
            ele2 = ele;
          }
          var target = ele2.displayObj;
          if (target == null) return; // 防止 刚刚被删除的物体.
          var offset = {x:target.x - evt.stageX, y:target.y - evt.stageY, firstTime:true};
          // add a handler to the event object's onMouseMove callback
          // this will be active until the user releases the mouse button:
          evt.onMouseMove = function (ev) {
            TQBase.Trsa.do(ele2, thislevel, offset, ev, stage.selectedItem);
          }
        };
        item.onMouseOver = function () {
          ele.highlight(true);
          thislevel.dirty = true;
        };
        item.onMouseOut = function () {
          if (!TQ.SelectSet.isSelected(ele)) {
            ele.highlight(false);
          }
        }
      })(this);
    }
  };

  p.highlight = function (enable) {
    assertNotNull(TQ.Dictionary.FoundNull, this.displayObj);
    if (!this.displayObj) {
      TQ.Log.criticalError(TQ.Dictionary.FoundNull);
      return;
    }
    if (this._isHighlighting == enable) return;

    this._isHighlighting = enable;
    if (this._isHighlighting) {
      this.displayObj.shadow = Element.getShadow();
    } else {
      this.displayObj.shadow = null;
    }
  };

  p.pinIt = function() {
    if (!this.jsonObj.isPinned) {
      this.jsonObj.isPinned = true;
    } else {
      this.jsonObj.isPinned = false;
    }
  };

  Element.getShadow = function () {
    if (!Element._shadow) {
      Element._shadow = new createjs.Shadow('#000000', 1, 1, 10);
    }
    return Element._shadow;
  };

  p._afterItemLoaded = function () {
    this.displayObj.isClipPoint = this.jsonObj.isClipPoint;
    this.animeTrack = this.jsonObj.animeTrack;
    if ((this._isNewSkin)) { // 编程哲学: 多少 是, 少用 非, 复合一般人的思维逻辑, 通顺.
      TQ.Log.out("element._afterItemLoaded"); // , 应该只在临时添加的时候, 才调用
      assertTrue(TQ.Dictionary.INVALID_LOGIC, false); // 应该只在临时添加的时候, 才调用
      TQ.StageBuffer.add(this); // 统一进入 stage的渠道.
      if ((this.jsonObj.zIndex != null) && (this.jsonObj.zIndex >= 0)) { // 原来是group, 没有皮肤, 所以是-1;
        stage.setChildIndex(this.displayObj, this.jsonObj.zIndex + 1); //ToDo: 为什么要加1 组合体才正确?
      }
      this._isNewSkin = false;
    } else {
      this.level.onItemLoaded(this);
    }
  };

  Element.compare = function(e1, e2) {
    assertNotNull(e1);
    assertNotNull(e2);
    var id1 = e1.jsonObj.zIndex;
    var id2 = e2.jsonObj.zIndex;
    // 凡是出错的地方, 加一道检查,让它主动报错
    assertTrue(TQ.Dictionary.INVALID_LOGIC, id1 >= -1 ); // group元素, 没有显示物, 所以是-1,
    assertTrue(TQ.Dictionary.INVALID_LOGIC, id2 >= -1 ); // 元素的可见性顺序 >= -1
    return id1 - id2;
  };

  p.sort = function () {
    this.children.sort(TQ.Element.compare);
  };

  p._removeM = function()
  {
    this.jsonObj.IM = null;
    this.jsonObj.M = null;
    if (this.children != null) {
      for (var i = 0; i < this.children.length; i++) {
        this.children[i]._removeM();
      }
    }
  };

  p.toJSON = function()
  {
    //备注：displayObj 本身里面有Cycle， 无法消除。所以必须让他null。
    // JQuery 调用的toJSON， 只需要这个字段即可， 一定不要在这里调用stringify！
    this.highlight(false);
    this.jsonObj.displayObj = null;
    this.jsonObj.animeTrack = this.animeTrack;
    this._removeM();
    this.parent = null;
    if (this.trace) {
      this.jsonObj.trace = this.trace;
    }

    // 如果要输出多个字段， 可以采用下面的方式： 不带字段名称， 用数组； 用{}可以自定义字段显示名称
    // [this.jsonObj, this.animeTrack];
    // {"jsonObj":this.jsonObj, "animeTrack": this.animeTrack};
    return this.jsonObj;
  };

  p.afterToJSON = function ()
  {
    //  只是为了输出, 才临时赋值给它, 现在收回.
    this.jsonObj.animeTrack = null;

    // rebuild 关系
    if (this.children != null) {
      for (var i = 0; i < this.children.length; i++) {
        this.children[i].parent = this;
      }
    }
  };

  p.isUserControlling = function() {
    // 鼠标右键按下, 就是操作 (不论是否move.
    // 注意: Mousemove事件只在鼠标移动时候发出.  不移动就不发出, 即使 鼠标一直按住该物体.
    return (TQ.InputMap.IsOperating() && TQ.SelectSet.isSelected(this));
  };

  p.update = function(t) {
    if (!this.isLoaded()) return;
    this.updateDecorations(t); //根据Marker，移动Pivot点
    // 如果有拍摄, 先拍摄
    var parentPose = (null == this.parent)? null : this.parent.jsonObj;
    var motionType = 0; // 没有变化, 使用上一个时刻的 世界坐标
    if (!TQBase.LevelState.isOperatingTimerUI()) {
      if (this.dirty2 || this.isUserControlling()){
        // TQ.Log.out("操作: " + TQBase.Trsa.lastOperationFlag);
        if (!this.getOperationFlags()) {  // 鼠标按住, 但是 没有移动, 单独确定操作状态
          this.setFlag(TQBase.Trsa.lastOperationFlag);
          // TQ.Log.out("操作: " + TQBase.Trsa.lastOperationFlag +"last");
        }
        //  不能在此记录, 因为, Move, Rotate操作的时候, 不调用它update
        TQ.Pose.worldToObjectExt(this.jsonObj, parentPose);
        // 记录修改值
        TQ.TrackRecorder.record(this, t);
        motionType += 0x02;
      }
    }

    // 播放过程:
    // 1) 生成世界坐标:
    parentPose = (null == this.parent)? null : this.parent.jsonObj;
    if (this.hasAnimation()) { //  动画物体
      // 即使是 用户操作的物体, 也需要重新生成, 因为用户只操作了其中的几个轨道,
      //  而其余的轨道, 仍然需要使用原来的数据,
      // 当然, 此刻的计算,一是为此刻的显示, 二是为下一时刻的修改. 两用的.
      // 1.1A) 从动画轨迹 到物体坐标
      // 如果有动画数据, 才需要解码,生成新的 世界坐标. 否则,跳过
      // 先生成新的 物体坐标(TQ.Pose), 再转化到世界坐标系
      TQ.TrackDecoder.calculate(this.animeTrack, this.jsonObj, t);

      // 1.1B): 从物体坐标 TQ.Pose. 到世界坐标
      TQ.Pose._toWorldCoordinate(this.jsonObj, parentPose);
      motionType +=0x04 ;
    } else  if ((motionType == 0) && this.dirty)
    {
      // 1.2) 但是, 如果父物体移动了, 它也被动地被要更新
      TQ.Pose.worldToObjectExt(this.jsonObj, parentPose);
      TQ.Pose._toWorldCoordinate(this.jsonObj, parentPose);
    }

    // 1.3) 没有动画的物体, 也没有被操作,被移动, jsonObj 已经是世界坐标

    // 2) 从世界坐标 到 设备坐标
    this.setTRSAVZ();
    this.applyToDecorations();
    var debugON = false;
    if (debugON) {
      if ((stage.selectedItem != null) && (stage.selectedItem.id == this.displayObj.id)) {
        var sels =TQ.Dictionary.Selected +stage.selectedItem.id;
        //  值显示选中的物体:
        displayInfo2(sels + "本物体id:" + this.displayObj.id + "motionType: "+ motionType + " Pose: " + TQ.Pose.x +"," + TQ.Pose.y + "," +
                    "jsonObjXY:" + this.jsonObj.x  + ", " + this.jsonObj.y +
                    "displayObjXY:" + this.displayObj.x  + ", " + this.displayObj.y
        );
      }
    }

    if (this.jsonObj.isClipPoint == false) {
      assertArray(TQ.Dictionary.INVALID_LOGIC, this.children); // "children可以是空数组[], 但不能为null，或undefined"
      for (var i=0; i<this.children.length; i++) {
        // 传播dirty标志, 迫使child更新; dirty2的子关节不记录track
        if (this.dirty || this.dirty2) this.children[i].dirty = true;
        if (!(this.isMarker() && this.children[i].isUserControlling())) {
          this.children[i].update(t);
        }
      }
    }

    this.dirty = this.dirty2 = false;
  };

  // Marker 专用部分
  p.calPivot = function (xObjectSpace, yObjectSpace) {
    //  由于缩放系数， 物体空间的坐标被等比缩放了
    // 所以， 应该获取原始的 宽度和 高度， 在物体空间（也是原始的），来计算pivot值
    var dPivotX = xObjectSpace / this.displayObj.getWidth(true);
    var dPivotY = yObjectSpace / this.displayObj.getHeight(true);
    return {pivotX: this.jsonObj.pivotX + dPivotX, pivotY:this.jsonObj.pivotY + dPivotY};
  };

  p.movePivot = function(pivot, pos, marker) {
    this.jsonObj.pivotX = pivot.pivotX;
    this.jsonObj.pivotY = pivot.pivotY;
    this.moveTo(pos);

    // marker.moveTo(0, 0);
    marker.jsonObj.x = 0;
    marker.jsonObj.y = 0;
    marker.setFlag(Element.TRANSLATING); // 要求重新记录新的（x,y), 而不是用老的值计算
    marker.dirty = true;
    // marker.dirty2 = true; // 不能设dirty2！！
  };

  p._move_TBD_NOT_USED = function(dx, dy) {
    this.jsonObj.x += dx;
    this.jsonObj.y += dy;
    this.setFlag(Element.TRANSLATING);
  };

  p.moveTo = function(point) {
    this.jsonObj.x = point.x;
    this.jsonObj.y = point.y;
    this.setFlag(Element.TRANSLATING);
    this.dirty = true;
    this.dirty2 = true;
  };

  p.rotateTo = function(angle) {
    this.jsonObj.rotation = angle;
    this.setFlag(Element.ROTATING);
    this.dirty = true;
    this.dirty2 = true;
  };

  p.scaleTo = function(scale) {
    this.jsonObj.sx = scale.sx;
    this.jsonObj.sy = scale.sy;
    this.setFlag(Element.SCALING);
    this.dirty = true;
    this.dirty2 = true;
  };

  p.updateDecorations = function(t) {
    if (!this.decorations) {
      return; // 例如: 本身是decoration, 没有其他decoration
    }
    for (var i = 0; i< this.decorations.length; i++) {
      var dec = this.decorations[i];
      if (!dec) continue;
      dec.update2(t);
    }
  };

  p.applyToDecorations = function () {
    if (!this.decorations) {
      return; // 例如: 本身是decoration, 没有其他decoration
    }
    for (var i = 0; i< this.decorations.length; i++) {
      var dec = this.decorations[i];
      if ((dec != null) && dec.isUserControlling()) { // 迫使Market重新计算， Marker没有动画, 永远都在pivot点
        dec.apply(this);
      }
    }
  };

  p.updateHighlighter = function(s) {
    if ((!this.displayObj) || (!this.displayObj.getHeight)) {
      TQ.Log.criticalError(TQ.Dictionary.FoundNull);
      return;
    }

    s.graphics.clear(); // 清除老的边框
    var radius = 5;
    s.graphics.ss(5).beginStroke("#f0f").
      beginRadialGradientFill(["#FFF","#0FF"],[0,1],0,0,0,0,0,radius).
      drawCircle(0,0,radius).endFill();
  };

  // upgrade 工具：
  Element.upgrade = function(jsonStr) {
    //资源路径的变换：2013.3.30: 合并到 yt360
    // "assets/" 为"mcAssets/"
    // "sounds/" 为"mcSound/"
    // "images/" ==》 ”mcImages";
    if (jsonStr.indexOf("images/") >= 0) {
      jsonStr = jsonStr.replace("images/", TQ.Config.IMAGES_CORE_PATH);
    }

    if (jsonStr.indexOf('assets/') >= 0) {
      jsonStr = jsonStr.replace('assets/', TQ.Config.SCENES_CORE_PATH);
    }

    if (jsonStr.indexOf("thumbs/") >= 0) {
      jsonStr.replace("thumbs/", TQ.Config.THUMBS_CORE_PATH);
    }

    //改相对路径：2013.5.14, 支持U盘版本
    jsonStr = jsonStr.replace("http://" + TQ.Config.DOMAIN_NAME + "/","");
    return jsonStr;
  };

  p.upgradeFont = function (desc) { // R308引入，
    var str = desc.font.replace("px","");
    var arr = str.split(" ");
    if (arr.length >= 1) {
      if (!desc.fontFace)  desc.fontFace = arr[1];
      if (!desc.fontSize)  desc.fontSize = arr[0];
    }
    if (!desc.fontFace)  desc.fontFace = TQ.Config.fontFace;
    if (!desc.fontSize)  desc.fontSize = TQ.Config.fontSize;
    if (!desc.color)  desc.color = TQ.Config.color;
  };

  // 小函数区域: has, is, 这些函数容易理解, 放到最后, 让重要的函数, 需要经常看的函数,放到前面
  p.setText = function(htmlStr) {
    assertDepreciated(TQ.Dictionary.isDepreciated);
  };

  p.setText = function(str, fontFamily, fontSize, fontColor) {
    assertTrue(TQ.Dictionary.INVALID_PARAMETER, this.isText()); //应该是Text元素
    // 此处不用再检验, 因为他不直接对用户, 只要那些直接对用户的函数, 把好关就行.
    // 但是一定要断言, 确信: 外围站岗的尽责了.
    if ( this.displayObj != null) {
      this.displayObj.text = this.jsonObj.text = str;
      this.displayObj.color = this.jsonObj.color = fontColor;
      this.jsonObj.fontSize = fontSize;
      this.jsonObj.fontFace = fontFamily;
      this.displayObj.font = TQ.Utility.toCssFont(this.jsonObj.fontSize, this.jsonObj.fontFace);
    }
  };

  // 工厂, 根据数据制作
  Element.build = function (level, desc) {
    // 此处已经组装好了目录
    switch (desc.type) {
      case "SOUND":
        return new TQ.SoundElement(level, desc);
      case "JointMarker":
        return new TQ.Marker(level, desc);
      default :
        return new Element(level, desc);
    }
  };

  p.hasAnimation = function() {
    return (!((this.animeTrack == undefined) || (this.animeTrack == null)));
  };

  p.isLoaded = function() {
    return !((this.displayObj == undefined) || (this.displayObj == null));
  };

  // 样例： <font color="#f74107" size="6" face="隶书">用克隆键</font>
  p.toHtmlStr = function() {
    return '<font color="' + this.jsonObj.color + '" size="' +
        ((this.jsonObj.fontSize - 6) / 5) + '" face="' +
        this.jsonObj.fontFace +'">' +
        this.jsonObj.text + '</font>';
  };

  Element.parseHtmlStr = function (jsonObj, htmlStr) {
    jsonObj.text = TQ.Utility.extractTag("font",htmlStr, jsonObj.text);
    var oldSize = jsonObj.fontSize;
    jsonObj.fontSize = TQ.Utility.extractAttr("font", "size", htmlStr, jsonObj.fontSize);
    if (oldSize != jsonObj.fontSize) {
      jsonObj.fontSize = jsonObj.fontSize * 5 + 6;
    }
    jsonObj.fontFace = TQ.Utility.extractAttr("font", "face", htmlStr, jsonObj.fontFace);
    jsonObj.color = TQ.Utility.extractAttr("font", "color", htmlStr, jsonObj.color);
  };

  p.isClipPoint = function () {return this.jsonObj.isClipPoint;};
  p.isText = function () { return (this.jsonObj.text != undefined); };
  p.isSound = function() { return (this.jsonObj.type == "SOUND"); };
  p.getTextHtml = function () { assertTrue(TQ.Dictionary.INVALID_PARAMETER, this.isText()); return this.toHtmlStr();}; // 必须是Text
  p.getFont = function () { assertTrue(TQ.Dictionary.INVALID_PARAMETER, this.isText()); return this.jsonObj.font;}; //必须是Text
  p.isLeaf = function() { return ((this.children == null) || (this.children.length < 1)); };
  p.isRoot = function() { return (this.parent == null);};
  p.isJoint = function() { return ((this.parent != null) && (this.jsonObj.state & Element.JOINTED));};
  p.isMarker = function() { return (this.jsonObj.type == "JointMarker");};
  p.isVirtualObject = function() {
    assertNotNull(TQ.Dictionary.FoundNull, this.displayObj); // 应该有可显示对象
    return ((this.displayObj.image == null) && (this.jsonObj.type == "Group"));
  };
  p.isValid = function () { // 非法的物体包括: 被删除的物体
    return (this.jsonObj || this.displayObj);
  };
  p.isPinned = function () {return ( this.jsonObj.isPinned); };
  p.hasBroken = function() { return (this.jsonObj.state & Element.BROKEN); };
  p.isGrouped = function() {
    if (this.children != null) {
      // assertTrue("如果非空, 必须有元素", this.children.length > 0);
    }
    return ((this.parent != null) || (this.children != null));
  };

  p.getRoot = function() {  // 任何时候, 都是root, 唯一化
    if (this.isGrouped()) {
      if (this.parent != null) return this.parent.getRoot();
    }
    return this;
  };

  p.getEditableElement = function() {  // 获取Group物体在整体操作模式下的可操作对象
    if (this.isGrouped() && (!TQ.InputCtrl.inSubobjectMode)) {
      if (this.parent != null) return this.parent.getEditableElement();
    }
    return this;
  };

  p.setFlag = function (flag) { this.state |= flag; };
  p.clearFlag = function (flag) { this.state &= ~flag; };
  p.hasFlag = function (flag) { return this.state & flag; };
  p.getOperationFlags = function() {return (this.state & 0xFFF0);};

  TQ.Element = Element;
}());
