/**
 * Created by Andrewz on 3/25/2017.
 */
TQ = TQ || {};

(function () {
  // 用法: GroupElement, 一个container， 包裹其子孙
  function GroupElement(level, jsonObj) {
    TQ.Element.call(this, level, jsonObj);
  }

  GroupElement.create = create;

  function create(level, elements) {
    TQ.Log.out("Group it");
    if (!elements || !elements.length) {
      return;
    }

    // 以第一个物体的参数为主, 建立Group元素.
    var pos = elements[0].getPositionInWorld();
    var desc = {
      x: pos.x, // elements[0].jsonObj.x,
      y: pos.y, // elements[0].jsonObj.y,
      type: TQ.ElementType.GROUP,
      autoFit: TQ.Element.FitFlag.KEEP_SIZE
    };
    var ele = TQ.Element.build(level, desc);
    var expectedZ = calZ(elements);
    stageContainer.addChildAt(ele.displayObj, expectedZ);
    ele.update(TQ.FrameCounter.t());

    for (var i = 0; i < elements.length; i++) {
      level.pickOffChild(elements[i]);
      ele.addChild(elements[i]);
      if (TQ.Config.useCreateJSFullContainer) {
        stageContainer.removeChild(elements[i].displayObj);
        ele.displayObj.addChild(elements[i].displayObj);
      }
    }

    if (TQ.Config.useCreateJSFullContainer) {
      for (var i = 0; i < elements.length; i++) {
        stageContainer.addChild(elements[i].displayObj);
        ele.displayObj.removeChild(elements[i].displayObj);
      }
    }

    return ele;
  }

  function calZ(elements) {
    var expectedZ = elements[0].getZ(),
      n = elements.length;
    for (var i = 0; i < n; i++) {
      expectedZ = Math.max(expectedZ, elements[i].getZ());
    }
    return expectedZ - n + 1;
  }

  var p = GroupElement.prototype = Object.create(TQ.Element.prototype);
  p._doLoad = function () {
    assertNotNull(TQ.Dictionary.
      FoundNull, this.jsonObj); // 合并
    // 建立空的 displayObj 以容纳设备空间的参数
    this.displayObj = new createjs.Container();
    this.loaded = true;
    this._afterItemLoaded();
    this.setTRSAVZ();
  };

  p.getWidth = function () {
    return (this.children.length < 2) ? 1: this.children[0].getWidth();
  };

  p.getHeight = function () {
    return (this.children.length < 2) ? 1 : this.children[0].getHeight();
  };

  p._initializeComponent = function (desc) {
    // 如果从groupFile来的，
    if ((this instanceof TQ.GroupElement) && (this.isElementFile)) {
      this.setupZIndex();
    }

    TQ.StageBuffer.open();
    this.initialize(desc);
    TQ.StageBuffer.close();
    TQ.DirtyFlag.setElement(this); // 强制更新group元素的时间
    self = this;
    currScene.currentLevel.registerHandler(function () {
      self.shrinkToStage();
    })    
  };

  // 如果超出了屏幕范围，则缩小比例，以占据屏幕正中心的80%
  p.shrinkToStage = function () {
    let geoBox = this.calGeoBox(),
      scale = Math.min(currScene.getDesignatedWidth() * 0.8 / geoBox.getWidth(),
        currScene.getDesignatedHeight() * 0.8 / geoBox.getHeight());
    if (scale < 1) {
      //tips: 必须用Timeout包裹，才能正确地更新,否则，画面不改变
      setTimeout(function () {
        self.scale(scale);
      });
    }
  }

  p.loadFromFile = function (jsonFiledesc) {
    var opusDesc;
    this.children = [];
    // 调入 json文件, 取其中的 elements
    (function (pt) {
      $.ajax({
        type: 'GET',
        url: jsonFiledesc.src
      }).done(function (jqResponse) {
        try {
          var opusJson = TQ.Scene.decompress(jqResponse.data);
          opusDesc = JSON.parse(TQ.Element.upgrade(opusJson));
        } catch (e) {
          displayInfo2(jqResponse);
          TQ.Log.error(jqResponse + ". " + e.toString());
          // 给一个空白文件， 确保可持续进行
          opusDesc = TQ.Scene.getEmptySceneJSON();
        }

        if (opusDesc.version !== TQ.Scene.VER_LATEST) {
          TQ.Scene.upgradeToLatest(opusDesc);
          opusDesc.version = opusDesc.version;
        }

        var groupEleDesc = pt._extractComponent(opusDesc, jsonFiledesc.x, jsonFiledesc.y, jsonFiledesc.zIndex);
        groupEleDesc.t0 = jsonFiledesc.t0;

        pt.isElementFile = true;
        if (!TQ.RM.isEmpty) {
          TQ.RM.onCompleteOnce(function () {
            pt._initializeComponent(groupEleDesc);
          });
        } else { // 资源都已经装入了，
          pt._initializeComponent(groupEleDesc);
        }
      });
    })(this);

    // 对元件文件, 生成了一个Group，他们也需要 一个 animeTrack
    this.animeTrack = this.jsonObj.animeTrack;
  };

  p._extractComponent = function (objJson, x, y, zMax) {
    if (!this.jsonObj) {
      this.jsonObj = {};
    }

    if (!this.jsonObj.children) {
      this.jsonObj.children = [];
    }

    // ToDo: 暂时只支持1个level的组件，（下面的多level合并逻辑，要重新考虑）
    // 选取 元件中的所有元素, 作为当前元素的子元素, 如果有多个level, 则合并到一个Level
    if (objJson.levels.length > 1) {
      objJson.levels.splice(1);
      TQ.Log.error("元件只能有1个场景");
    }

    if (objJson.levels[0].elements.length > 1) {
      TQ.Log.error("元件只能有1个根元素");
      objJson.levels[0].elements.splice(1);
    }

    var component = objJson.levels[0].elements;
    TQ.RM.addElementDescList(component);
    this.jsonObj = component[0];
    this.jsonObj.type = "Group";  // 不论是单个物体还是多个物体,总是建立虚拟物体group， 以保留其原有的动画
    this.jsonObj.x = x;
    this.jsonObj.y = y;
    this.jsonObj.zIndex = zMax;
    return this.jsonObj;
  };

  p.setupZIndex = function () {
    // 新插入的元件，元件各个子元素的zIndex要升高，使他置于top，可见
    if (!this.level.isActive()) {
      return;
    }

    var zMax = TQ.Utility.getMaxZ(),
      pool = [],
      children = this.jsonObj.children;

    pool.push(this.jsonObj);
    if (children) {
      pool = pool.concat(getChildrenFromDesc(children));
      pool.sort(compareDesc);
      for (i = 0; i < pool.length; i++) {
        if (pool[i]) {
          pool[i].zIndex = zMax + i;
        }
      }
    }

    function compareDesc(desc1, desc2) {
      assertNotNull(desc1);
      assertNotNull(desc2);
      var id1 = desc1.zIndex;
      var id2 = desc2.zIndex;
      // 凡是出错的地方, 加一道检查,让它主动报错
      assertTrue(TQ.Dictionary.INVALID_LOGIC, id1 >= -1); // group元素, 没有显示物, 所以是-1,
      assertTrue(TQ.Dictionary.INVALID_LOGIC, id2 >= -1); // 元素的可见性顺序 >= -1
      return id1 - id2;
    }
  };

  function getChildrenFromDesc(children) {
    var i,
      pool = [];
    for (i = 0; i < children.length; i++) {
      pool.push(children[i]);
      if (children[i].children) {
        pool = pool.concat(getChildrenFromDesc(children[i].children));
      }
    }
    return pool;
  }

  TQ.GroupElement = GroupElement;
}());
