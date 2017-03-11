/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 */
window.TQ = window.TQ || {};

(function () {
    TQ.ElementType = {
        BITMAP: "Bitmap",
        SOUND: "SOUND",
        TEXT: "Text",
        GROUP: "Group",
        GROUP_FILE: "GroupFile",
        BITMAP_ANIMATION: "BitmapAnimation"
    };

    var DescType = {
        BITMAP: "Bitmap",
        BITMAP_ANIMATION: "BitmapAnimation",
        BUTTON: "BUTTON",
        GROUP: "Group",
        GROUP_FILE: "GroupFile",
        JOINT_MARKER: "JointMarker",
        FULLSCREEN_EFFECT_PARTICLE: "fullscreenEffectParticle",
        RAIN: "RainEffect", // TBD
        SNOW: "SnowEffect", // TBD
        RECTANGLE: "Rectangle",
        SOUND: "SOUND",
        TEXT: "Text",
        TEXT_BUBBLE: "TextBubble"
    };

    function Element(level, desc) {
        if (level != null) {  // 适用于 子类的定义, 不做任何初始化,只需要prototype
            this.level = level;
            this.children = [];
            this.decorations = null;
            this._isNewSkin = false;
            this._isHighlighting = false;
            this.animeCtrl = null;
            this.viewCtrl = null;
            this.state = (desc.state == undefined) ? 0 : desc.state;
            this.dirty = this.dirty2 = false;
            if (!!desc.autoFit) { //所有新加的元素都必须有此属性， 从文件中load的元素则无
                this.autoFitFlag = desc.autoFit;
                this.isNewlyAdded = true;
            } else {
                this.autoFitFlag = false;
                this.isNewlyAdded = false;
            }
            delete(desc.autoFit);
            this.initialize(desc);
        }
    }

    Element.FitFlag = {
        KEEP_SIZE: 1,
        FULL_SCREEN: 2,
        WITHIN_FRAME: 3,
        NO: 4
    };

    Element.counter = 0;
    Element.VER1 = "V1";
    Element.VER2 = "V2"; // 从2014-3-2日开始使用
    Element.VER3 = 3; // 从2016-6-1日开始使用
    Element.TOP = 99999; // zIndex of top element

    // 0x01--0x1F是固定结构部分，    需要保存到WDM文件中；之后的高位是动态的
    Element.JOINTED = 0x02;     // 关节体中的所有子物体,不包括根关节自己.
    Element.ROOT_JOINT = 0x04;  // 根关节自己, 版本V2开始添加
    Element.BROKEN = 0x10; // 相对运动: 子物体可以独立运动,也随父物体移动(布局用).绝对运动: 只能整体运动, 或者IK运动.

    // 以下是操作, 对应于唯一的动画track
    Element.TRANSLATING = 0x20; // 被操作之后, 马上值为真, 以便于拍摄记录
    Element.ROTATING = 0x40;
    Element.SCALING = 0x80;
    Element.ALPHAING = 0x100;
    Element.ZING = 0x200;
    Element.VISIBLE_CHANGED = 0x400;
    Element.ACTION_CHANGED = 0x800;

    // 元素的类别
    Element.ETYPE_BACKGROUND = 1; //1 背景，
    Element.ETYPE_PROP = 2; // 道具
    Element.ETYPE_CHARACTER = 3; // 人物
    Element.ETYPE_TEXT = 4; // 文字
    Element.ETYPE_EFFECT = 5; //5 特效，
    Element.ETYPE_BUTTON = 6; //按钮
    Element.ETYPE_AUDIO = 7; // 声音
    Element.ETYPE_PART = 8; // 零件

    // 元素的类别资源类别
    Element.TYPE_BITMAP = 2; // 图片
    Element.TYPE_COMPONENT = 3; // 元件
    Element.TYPE_BUTTON = 4; // 按钮
    Element.TYPE_SOUND = 11; // 声音

    Element.TO_RELATIVE_POSE = (Element.TRANSLATING | Element.ROTATING | Element.SCALING
        | Element.ZING | Element.ALPHAING);  //  在组成Group, Joint, 显示 Pivot Marker的时候需要.
    Element.CLEAR_ANIMATATION = 0x8000; //清除全部track, 重新记录;
    Element.IN_STAGE = 0x10000; // 加入到了Stage;
    Element.LOADED = 0x20000; //

    Element.showHidenObjectFlag = false;  //  个人的state由个人记录, 上级可以控制
    var p = Element.prototype;
    p = TQ.CreateJSAdapter.attach(p);
    p.loaded = false;
    p.jsonObj = null;
    p.displayObj = null;
    p.parent = null;
    p.children = [];  //  注意： 缺省是空数组， 不是null， 确保每一个参数都有缺省值！！！
    p.animeTrack = {}; // 只是数组指针, 和jsonObj 共用数据, 没有重复

    p.show = function (isVisible) {
        this.jsonObj.isVis = isVisible;
        if (this.displayObj) {
            if (this.jsonObj.isVis && !this.hasFlag(Element.IN_STAGE)) {
                TQ.Log.out(TQ.Dictionary.INVALID_LOGIC); // show + _doAddItemToStage 飞线, 适用于: 1) load之时不可见的元素, 2) marker初次创建时, 不可见
                TQ.StageBuffer.add(this);
            }
        } else {
            if (this.isFEeffect() || this.isSound() || this.isGrouped() || this.isGroupFile()) {
            } else {
                TQ.AssertExt.invalidLogic(this.displayObj === undefined, "没有displayObj的元素，需要重定义show接口???");
            }
        }
        //ToDo: 留给显示函数做, 不能一竿子插到底,  this.displayObj.visible = isVisible;
        this.dirty2 = true;
        TQBase.LevelState.saveOperation(TQBase.LevelState.OP_CANVAS);
        this.setFlag(Element.VISIBLE_CHANGED);

        // show命令， 只是改变这个实体本身的可见性标志，不能直接传遍所有孩子。
        // 其孩子的实际可见性 = 父物体实际可见性 && 孩子的可见性标志 ，
        // 详细见： setTRSAVZ() 和 isVisible()
    };

    p.toggleVisibility = function () {
        if (this.isPinned()) {
            return;
        }
        this.show(!this.jsonObj.isVis);
        TQ.DirtyFlag.setElement(this);
    };

    // Add image item
    p.initialize = function (desc) {
        this.id = createjs.UID.get();
        if ((this.level.isStageReady())) {
            // 如果所需资源都在RM， 则直接init， 否则，sent到RM， 要求调入。完成后， 再init
            if ((desc.type == "SOUND") || (desc.type == "Bitmap") || (desc.type == "BUTTON")){
                TQ.Assert.isTrue(TQ.RM.hasResourceReady(desc.src), "先准备好资源， 再创建元素");
            }
        }

        this.dirty = false;
        this.dirty2 = false;  // 仅当需要在game循环之外调用element.update强制"拍摄"的时候令它为true
        this.version = desc.version;
        desc.x = (desc.x == null) ? 0 : desc.x;
        desc.y = (desc.y == null) ? 0 : desc.y;
        this.jsonObj = this.fillGap(desc);
        switch (desc.type) {
            case DescType.GROUP_FILE:
                this._addComponent(desc);
                break;
            case DescType.BITMAP_ANIMATION:
                this._addActorByUrl(desc, null);
                break;
            default:
                this.load(desc);
        }

        /// assertTrue("错误的元素信息: " + JSON.stringify(itemURL), false);
        return null;
    };

    p._initializeComponent = function (desc) {
        TQ.StageBuffer.open();
        this.initialize(desc);
        TQ.StageBuffer.close();
    };

    p._addComponent = function (jsonFiledesc) {
        this.children = [];
        // 调入 json文件, 取其中的 elements
        (function (pt) {
            TQ.Assert.isTrue(false, "先准备好资源， 再创建元素");
            netOpen(jsonFiledesc.src, function (jqResponse) {
                try {
                    var desc = JSON.parse(jqResponse);
                } catch (e) {
                    displayInfo2(jqResponse);
                    TQ.Log.error(jqResponse + ". " + e.toString());
                    // 给一个空白文件， 确保可可持续进行
                    desc = TQ.Utility.getEmptyScene();
                }

                desc = pt._extractComponent(desc, jsonFiledesc.x, jsonFiledesc.y, jsonFiledesc.zIndex);
                desc.t0 = jsonFiledesc.t0;

                TQ.RM.setPaused(true);
                if (!TQ.RM.isEmpty) {
                    TQ.RM.onCompleteOnce(function () {
                        pt._initializeComponent(desc);
                        TQ.SelectSet.add(pt);
                    });
                    TQ.RM.setPaused(false);
                } else { // 资源都已经装入了，
                    TQ.RM.setPaused(false);
                    pt._initializeComponent(desc);
                }
            });
        })(this);

        // 对元件文件, 生成了一个Group，他们也需要 一个 animeTrack
        this.animeTrack = this.jsonObj.animeTrack;
    };

    p._loadComponent = function () {
        assertNotNull(TQ.Dictionary.FoundNull, this.jsonObj); // 合并
        // 建立空的 displayObj 以容纳设备空间的参数
        this.displayObj = {};
        this.loaded = true;
        this._afterItemLoaded();
        this.setTRSAVZ();
    };

    Element.liftZ = function (jsonObj, zBase) {
        if (jsonObj.zIndex != -1) { // Group物体的zIndex，总是-1
            jsonObj.zIndex += zBase;
        }
        if (jsonObj.children) {
            for (var i = 0; i < jsonObj.children.length; i++) {
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
                    TQ.RM.addElementDesc(level.elements[j]);
                }
            }
        }

        this.jsonObj.type = "Group";  // 不论是单个物体还是多个物体,总是建立虚拟物体group， 以保留其原有的动画
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
    p.fillGap = function (desc) {
        // 所有元素， 在add之后， 都需要经过load， 从资源中调进来。
        if (!!desc.name) {
            desc.name = "element" + Element.counter++;
        }

        if (desc.type == undefined) {
            desc.type = "Bitmap";
        }

        if (desc.eType == undefined) {
            desc.eType = Element.type2eType(desc.type);
        }

        if (desc.state == undefined) {
            desc.state = 0;
        }

        if (desc.isVis == undefined) {
            desc.isVis = true;
        }

        if (desc.isClipPoint == undefined) {
            desc.isClipPoint = false;
        }

        if (desc.x == undefined) { // 区别： 如果 desc.x 是 0， 则不会重新被赋值
            desc.x = 0;
        }

        if (desc.y == undefined) {
            desc.y = 0;
        }

        if (desc.zIndex == undefined) {
            desc.zIndex = Element.TOP;
        }
        if (desc.type == "Text") {
            desc.pivotX = (desc.pivotX === undefined) ? TQ.Config.TEXT_PIVOT_X : desc.pivotX;
            desc.pivotY = (desc.pivotY === undefined) ? TQ.Config.TEXT_PIVOT_Y : desc.pivotY;
        } else {
            desc.pivotX = (desc.pivotX === undefined) ? TQ.Config.pivotX : desc.pivotX;
            desc.pivotY = (desc.pivotY === undefined) ? TQ.Config.pivotY : desc.pivotY;
        }

        if (desc.rotation == undefined) {
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

    p.fillGap2 = function() {
        var desc = this.jsonObj;
        if ((desc.sx == undefined)|| (desc.sy == undefined)) {
            if (this.isMarker()) {
                this.markerScaleOne(desc);
            } else {
                this.scaleOne(desc);
            }
        }
    };

    Element.type2eType = function (type) {
        switch (type) {
            case "Text":
                return 4;
            case "SOUND":
                return  7;
            case "Group":
                return 2;
            case "Bitmap":
                return 1;
            default:
                return 1;
        }
        return 1;
    };

    p.load = function () {
        // 记录到element中
        if ((this.jsonObj.src != undefined) && (this.jsonObj.src != null)) {
            this.jsonObj.src = Element.upgrade(this.jsonObj.src);
        }

        var desc = this.jsonObj;
        switch (desc.type) {
            case DescType.BITMAP_ANIMATION:
                this._loadActor();
                break;
            case DescType.GROUP:
                this._loadComponent();
                break;
            case DescType.JOINT_MARKER:
                this._loadMarker();
                break;
            default :
                this._doLoad();
                break;
        }

        if (desc.trace) {
            this.trace = TQ.Trace.build(desc.trace);
        }

        if (desc.animeCtrl != null) {
            this.animeCtrl = new TQ.Animation(desc.animeCtrl);
        }

        if (desc.viewCtrl != null) {
            this.viewCtrl = new TQ.MultiView(desc.viewCtrl);
        }

        this.setupChildren();
        return desc;
    };

    p.setupChildren = function () {
        if (!(!this.jsonObj.children)) {
            for (var i = 0; i < this.jsonObj.children.length; i++) {
                this.addChild(this.jsonObj.children[i]);
            }
        }
    };

    p.getTextBubble = function() {
        var bubble = null;
        if (!!this.children) {
            for (var i = 0; i < this.children.length; i++) {
                if (this.children[i] instanceof TQ.TextBubble) {
                    bubble = this.children[i];
                    break;
                }
            }
        }

        return bubble;
    };

    p.findChild = function (childDisplayObj) {
        if (this.children == null) {
            return null;
        }

        var result = null;
        for (var i = 0; i < this.children.length; i++) {
            if (this.children[i].displayObj != null) {
                if (this.children[i].displayObj.id == childDisplayObj.id) {
                    return this.children[i];
                }
            }

            result = this.children[i].findChild(childDisplayObj);
            if (result != null) break;
        }

        return result;
    };

    p.addJoint = function (ele) {
        assertTrue(TQ.Dictionary.INVALID_LOGIC, TQ.InputCtrl.inSubobjectMode); //在零件模式下
        if (ele.state == undefined) {
            ele.state = 0;
        }

        TQBase.LevelState.saveOperation(TQBase.LevelState.OP_CANVAS);
        ele.setFlag(Element.JOINTED);
        this.addChild(ele);
        this.dirty2 = true;
    };

    p.neverUpdated = function() {
        return !this.jsonObj.M;
    };

    p.addChild = function (desc, isInObjectSpace) {
        if (desc.displayObj != null) { // 在group或者joint物体的时候,出现
            var child = desc; // 已经是物体了, 不用创建了. 但是,需要衔接jsonObj
            var t = TQ.FrameCounter.t();
            if (this.neverUpdated()) { // 新创建的元素，必须update以求出矩阵M
                this.dirty = true;
                this.update(t, TQ.Const.NO_RECORDING_TRUE);
            }

            if (isInObjectSpace) {
                var posWorld = this.object2World(child.jsonObj);
                child.jsonObj.x = posWorld.x;
                child.jsonObj.y = posWorld.y;
            }

            //从世界坐标, 变换到父物体坐标系: 由Update来做
            var p = {};
            p.t = t;
            Element.copyWorldData(p, child.jsonObj);
            var worldData = [];
            this.saveWorldDataAll(worldData, child);
            child.parent = this;
            child.animeTrack = null; // group元素和关节，都会丢失原来的动画轨迹!!!
            this.children.push(child);
            this.toRelative(worldData, child);
            Element.copyWorldData(child.jsonObj, p);

            //ToDo： 是不是可以不加入到jsonObj.children中？
            // 因为保存的时候， 总是遍历this.children的， 而且会忽视jsonObj.children
            if (!this.jsonObj.children) {
                this.jsonObj.children = [];
            }
            this.jsonObj.children.push(child.jsonObj);
            child.dirty = true;
            child.forceToRecord();
            child.update(t); // 必须强制记录， 否则，无法生成AnimeTrack

            TQ.DirtyFlag.setElement(this);
            child.dirty2 = this.dirty2 = true;  // 迫使系统更新child的位置数据位相对坐标
            child.setFlag(Element.TO_RELATIVE_POSE);

        } else {
            var host = this;
            child = Element.build(this.level, desc, host);
            this.addChildDirect(child);
        }
        return child;
    };

    /*
     child 必须已经是 元素， 而且， 不需要经过相对化坐标变换
     */
    p.addChildDirect = function (child) {
        child.parent = this;
        if (!this.children) {
            this.children = [];
        }
        this.children.push(child);
    };

    p.undeleteChild = function (child) {
        this.addChildDirect(child);
        child.addItemToStage();
    };

    Element.copyWorldData = function (a, b) {
        a.x = b.x;
        a.y = b.y;
        a.sx = b.sx;
        a.sy = b.sy;
        a.rotation = b.rotation;
        a.isVis = b.isVis;
    };

    p.saveWorldDataAll = function (worldData, child) {
        // 计算当前的世界坐标，并且保存,并且记录轨道的类别
        if (!child.animeTrack) {
            return;
        }
        if (child.animeTrack.x) child.saveWorldData(worldData, child.animeTrack.x, Element.TRANSLATING);
        if (child.animeTrack.sx) child.saveWorldData(worldData, child.animeTrack.sx, Element.SCALING);
        if (child.animeTrack.rotation) child.saveWorldData(worldData, child.animeTrack.rotation, Element.ROTATING);
        if (child.animeTrack.visible) child.saveWorldData(worldData, child.animeTrack.visible, Element.VISIBLE_CHANGED);
    };

    p.toRelative = function (worldData, child) {
        // 计算相对坐标， 并且录制。
        for (var i = 0; i < worldData.length; i++) {
            var p = worldData[i];
            TQ.DirtyFlag.setElement(this);
            child.dirty2 = this.dirty2 = true;  // 迫使系统更新child的位置数据位相对坐标
            child.setFlag(p.type);
            Element.copyWorldData(child.jsonObj, p);
            this.update(p.t, TQ.Const.NO_RECORDING_TRUE);
        }
    };

    p.saveWorldData = function (worldData, track, type) {
        //ToDo: 先计算所有parent的pose，再计算它的pose
        for (var i = 0; i < track.t.length; i++) {
            var t = track.t[i];
            this.update(t, TQ.Const.NO_RECORDING_TRUE);
            var p = {};
            p.t = t;
            p.type = type;
            Element.copyWorldData(p, this.jsonObj);
            worldData.push(p);
        }
    };

    p.removeChild = function (child) {
        if (!child || this.isPinned()) {
            return null;
        }
        assertNotNull(TQ.Dictionary.FoundNull, this.children); // "应该有孩子"
        var id = this.children.indexOf(child);
        assertTrue(TQ.Dictionary.INVALID_LOGIC, id >= 0); //"应该能够找到孩子"
        if (id >= 0) {
            child = (this.children.splice(id, 1))[0];
            if (this.jsonObj.children) { // 注意： marker和气泡，不在jsonObj里面
                id = this.jsonObj.children.indexOf(child.jsonObj);
                if (id >= 0) {
                    this.jsonObj.children.splice(id, 1);
                }
            }
            child.parent = null;
        }

        //迫使元素回到世界坐标系标示
        TQ.DirtyFlag.setElement(this);
        child.forceToRecord();
        this.forceToRecord();  // 迫使系统更新child的位置数据位相对坐标
        child.setFlag(Element.TO_RELATIVE_POSE);
        var t = TQ.FrameCounter.t();
        child.update(t);
        return child;
    };

    p.atomNum = function () {
        var sum = 1;
        for (var i = 0; i < this.children.length; i++) {
            sum += this.children[i].atomNum();
        }
        return sum;
    };

    p.skinning = function (skin) {
        var hostType = this.getType();
        if (hostType == "BUTTON") {
            hostType = "Bitmap";
        }
        if (hostType != skin.getType()) {
            TQ.MessageBubble.show(TQ.Dictionary.SAME_TYPE_SKIN + skin.getType(), false);
            return;
        }

        // 必须是相同的类别，才能够换皮肤
        // 暂存 Z可见性 和 新皮肤的名称,
        this.persist();
        if (this.isText()) {
            this.jsonObj.text = skin.jsonObj.text;
            this.jsonObj.fontSize = skin.jsonObj.fontSize;
            this.jsonObj.fontFace = skin.jsonObj.fontFace;
            this.jsonObj.color = skin.jsonObj.color;
        } else {
            this.jsonObj.src = skin.jsonObj.src;
        }
        this._doRemoveFromStage();
        this._isNewSkin = true;
        this._doLoad();
        skin.TBD = true;
    };

    p.attachDecoration = function (decs) {
        // ToDo: 处理每一个Marker
        var marker = decs[0];
        marker.host = this;
        marker.level = this.level;
        marker.reset();
        marker.createImage();
        this.dirty2 = marker.dirty2 = true;
        marker.setFlag(Element.TO_RELATIVE_POSE | Element.CLEAR_ANIMATATION); // 迫使他记录所有的track,
        var isInObjectSpace = true;
        this.addChild(marker, isInObjectSpace);
        this.decorations = decs;
        marker.show(true);
        marker.moveToTop();
    };

    p.detachDecoration = function () {
        if (!this.decorations) {
            return null;
        }
        var decorations = this.decorations;
        this.decorations = null;
        assertNotNull(TQ.Dictionary.FoundNull, decorations);
        for (var i = 0; i < decorations.length; i++) {
            var marker = decorations[i];
            marker.show(false);
            marker.displayObj.visible = false;
            marker.host = null;
            marker.level = null;
            this.removeChild(marker);
        }
        TQ.SelectSet.recycleDecoration(decorations);
        return decorations;
    };

    p.getImageResource = function(item, jsonObj) {
        if (item) {
            return item.res;
        }
        return jsonObj.img;
    };

    p._doLoad = function () {
        assertNotNull(TQ.Dictionary.FoundNull, this.jsonObj); //合并jsonObj
        var jsonObj = this.jsonObj;
        assertTrue("must has image name", jsonObj.src !== "");
        var item = TQ.RM.getResource(jsonObj.src);
        TQ.Assert.isNotNull(item, "先准备好资源， 再创建元素");
        this.loaded = true;
        var resource = this.getImageResource(item, jsonObj);
        this.displayObj = new createjs.Bitmap(resource);
        this._afterItemLoaded(resource);
        this.setTRSAVZ();
        TQ.DirtyFlag.setElement(this);
    };

    p.autoFit = function(img) {
        if (this.autoFitFlag === Element.FitFlag.NO) {
            return;
        }

        TQ.AssertExt.invalidLogic(img!==null, "未改造的元素？");
        // 保持图像长宽比例不失真
        // 自动充满整个画面 或者 保持物体的原始大小
        var sx = currScene.getDesignatedWidth() / this.getWidth(),
            sy = currScene.getDesignatedHeight() / this.getHeight();
        var desc = this.jsonObj,
            pWorld = this.nw2World({x: 0.5, y: 0.5});
        if (this.autoFitFlag != Element.FitFlag.NO) {
            desc.x = pWorld.x;
            desc.y = pWorld.y;
            desc.sx = sx;
            desc.sy = sy;
            desc.rotation = 0;
            desc.pivotX = 0.5;
            desc.pivotY = 0.5;
        }

        pWorld = desc;
        var minScale = Math.min(pWorld.sx, pWorld.sy);
        if ((this.autoFitFlag === Element.FitFlag.KEEP_SIZE) ||
            ((this.autoFitFlag === Element.FitFlag.WITHIN_FRAME) && (minScale > 1))) { // 框大， 图小，保持原尺寸
            pWorld.sx = 1;
            pWorld.sy = 1;
        } else { // 框子小， 图大， 需要缩小
                // 保持图像长宽比例不失真
            pWorld.sx = minScale;
            pWorld.sy = minScale;
        }
    };

    p.forceToRecord = function() {
        this.dirty2 = true; //迫使系统记录这个坐标
        this.setFlag(TQ.Element.TRANSLATING | TQ.Element.ROTATING | TQ.Element.SCALING);
    };

    p.setTRSAVZ = function () {
        var jsonObj = this.jsonObj;
        assertNotNull(TQ.Dictionary.FoundNull, this.jsonObj); //"世界坐标值jsonOb不能为空"
        if (!this.isSound()) { //"显示对象displayObj不能为空"
            assertNotNull(TQ.Dictionary.FoundNull, this.displayObj);
        }
        if (jsonObj.isVis && !this.isVirtualObject() && !this.hasFlag(Element.IN_STAGE)) {
            //飞线: 谁在使用这种情况?, 顶多在Show的时候检查"
            TQ.Log.warn(TQ.Dictionary.INVALID_LOGIC + ":setTRSAVZ一个不在DOM的元素：" + this.jsonObj.src);
            return;
        }

        // 可见性由父子共同决定：
        //  如果父物体为空， 该物体的可见性由自己的标志完全决定
        //  如果父物体非空：
        //      父亲实际不可见，则都不可见（一票否决制）；
        //      父亲实际可见，则孩子自己决定
        //
        //   物体的实际可见性就是 displayObj.visible,
        //          如果displayObj为空，用临时标志： visibleTemp,
        //
        var visSum = false;
        if (!this.parent) {
            visSum = jsonObj.isVis;
        } else {
            visSum = this.parent.isVisible() && jsonObj.isVis;
        }
        visSum = visSum || Element.showHidenObjectFlag;
        this.doShow(visSum);
    },

    p.doShow = function (visSum) {
        if (!this.displayObj) {
            this.visibleTemp = visSum;
        } else {
            this.displayObj.visible = visSum;
            this.toDeviceCoord(this.displayObj, this.jsonObj);
        }
    };

    p._loadActor = function () {
        assertNotNull(TQ.Dictionary.FoundNull, this.jsonObj); //合并jsonObj
        var spriteSheet = this.jsonObj;
        // 这里应该再有一个callback， 因为动画的图像需要花时间调入
        var ss = new createjs.SpriteSheet(spriteSheet);
        var anima = new createjs.Sprite(ss);
        this.loaded = true;

        // Set up looping
        ss.getAnimation("run").next = "run";
        ss.getAnimation("jump").next = "run";
        anima.gotoAndPlay("jump");
        this.displayObj = anima;
        this._afterItemLoaded(null);
        this.setTRSAVZ();
    };

    p.removeFromStage = function () {
        this._doRemoveFromStage();
        for (var i = 0; i < this.children.length; i++) {
            var child = this.children[i];
            child.removeFromStage();
        }
    };

    p._doRemoveFromStage = function () {
        if (this.isPinned()) {
            return;
        }

        TQ.TraceMgr.removeFromStage(this);
        if (this.displayObj) {
            stageContainer.removeChild(this.displayObj);
        }
        this.clearFlag(Element.IN_STAGE);
        TQ.DirtyFlag.setElement(this);
    };

    p.resetStageFlag = function () {
        this.clearFlag(Element.IN_STAGE);
        TQ.DirtyFlag.setElement(this);
        TQ.TraceMgr.removeFromStage(this);
        for (var i = 0; i < this.children.length; i++) {
            var child = this.children[i];
            child.resetStageFlag();
        }
    };

    p.persist = function () {
        // 记录当前数据到 json, 以便于存盘和再次切入该场景
        if (!this.jsonObj) {
            return;
        }
        if (!this.displayObj) {
            this.jsonObj.zIndex = -1;
        } else {
            this.jsonObj.zIndex = stageContainer.getChildIndex(this.displayObj);
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

        this.destroyDisplayObj();
        // 切断联系,以方便系统收回内存资源
        this.children = null;
        this.jsonObj = null;
        this.animeTrack = null;
    };

    p.destroyDisplayObj = function () {
        // 从stage中移除当前的 皮肤,(不再显示),
        // 同时,重置回调函数,阻止用户操作; 切断指针以便于释放内容,
        this._doRemoveFromStage();
        if (this.displayObj != null) {
            this.displayObj.jsonObj = null;
            this.displayObj.onPress = null;
            this.displayObj.onMouseOver = null;
            this.displayObj.onMouseOut = null;
            this.displayObj = null;
        }
    };

    p.eraseAnimeTrack = function () {
        if (this.isPinned()) {
            return;
        }

        if (this.children != null) {
            for (var i = 0; i < this.children.length; i++) {
                this.children[i].eraseAnimeTrack();
            }
        }

        TQ.TrackRecorder.erase(this);
        TQ.DirtyFlag.setElement(this);
    };

    p.deleteChild = function (ele) {
        if (this.isPinned()) {
            return;
        }

        if (this.children == null) {
            return false;
        }

        for (var i = 0; i < this.children.length; i++) {
            if (this.children[i] == ele) {
                this.children[i]._doRemoveFromStage();
                this.children.splice(i, 1);
                this.jsonObj.children.splice(i, 1);
                return true;
            }

            if (this.children[i].deleteChild(ele) == true) return true;
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
        item.ele = this;
        { // 不论是否可见， 都添加到stage中， 有visible来控制可见性， 确保层次关系是正确的
            this.setFlag(Element.IN_STAGE);
            if ((item.jsonObj.zIndex === Element.TOP) || (!upperEle) || (!upperEle.displayObj)) { // 没有在我之上的， 我就是top
                stageContainer.addChild(item);
            } else {
                var z = stageContainer.getChildIndex(upperEle.displayObj);
                if (z < 0) { // 是 group， 或者其它不可显示的物体
                    stageContainer.addChild(item);
                } else {
                    assertTrue(TQ.Dictionary.INVALID_PARAMETER, z >= 0); // 第一个元素的z = 0
                    assertTrue(TQ.Dictionary.INVALID_PARAMETER, z < stageContainer.getNumChildren());
                    stageContainer.addChildAt(item, z);  // 把upperEle 顶起来
                }
            }

            if (this.trace) {
                this.trace.addToStage();
            }

            // wrapper function to provide scope for the event handlers:
            if (TQ.Config.useCreateJsTouch) {

                (function (ele) {
                    var showFloatToolbar = function (evt) {
                        if ((TQ.FloatToolbar != undefined) && TQ.FloatToolbar.setPosition && TQ.FloatToolbar.show) {
                            TQ.FloatToolbar.setPosition(evt.stageX, evt.stageY);
                            TQ.FloatToolbar.show(this.getType());
                        }
                    };

                    item.onPress = function (evt) {
                        if (TQ.SceneEditor.isPlayMode()) {
                            return;
                        }
                        var ele2 = TQ.SelectSet.getEditableEle(ele);
                        TQ.SelectSet.add(ele2);
                        var target = ele2.displayObj;
                        if (target == null) return; // 防止 刚刚被删除的物体.
                        var offset = {x: target.x - evt.stageX, y: target.y - evt.stageY, firstTime: true};
                        // add a handler to the event object's onMouseMove callback
                        // this will be active until the user releases the mouse button:
                        showFloatToolbar(evt);
                        TQBase.LevelState.saveOperation(TQBase.LevelState.OP_CANVAS);
                        evt.onMouseMove = function (ev) {
                            if (TQ.SceneEditor.isPlayMode()) {
                                return;
                            }
                            TQ.FloatToolbar.close();
                            TQBase.Trsa.do(ele2, thislevel, offset, ev);
                        };
                        evt.onMouseUp = function (evt) {
                            showFloatToolbar(evt);
                            evt.onMouseUp = null;
                        };


                        if (TQ.displayUI && TQ.displayUI.displayMenu && TQ.displayUI.displayActionSet) {
                            TQ.displayUI.displayMenu(ele2, ele2.getEType());
                            TQ.displayUI.displayActionSet(ele2, ele2.getEType());
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
        }
    };

    p.highlight = function (enable) {
        if (this.isSound() || this.isGroupFile() || this.isButton()) return;
        assertNotNull(TQ.Dictionary.FoundNull, this.displayObj);
        if (!this.displayObj) {
            TQ.Log.criticalError(TQ.Dictionary.FoundNull);
            return;
        }
        if (this._isHighlighting == enable) return;

        if (TQ.Config.hightlightOn) {
            this._isHighlighting = enable;
        } else {
            this._isHighlighting = false;
        }

        // 通过dirty flag迫使系统更新， 并且重绘，而不是直接绘制
        TQ.DirtyFlag.setElement(this);
    };

    p.createHighlighter = function() {
        this.displayObj.shadow = Element.getShadow();
        if (TQ.Config.useHighlightBox) {
            this.highter = this.createBBox(1, 1, this.getRotation(),
                this.getWidth(), this.getHeight());
            stageContainer.addChild(this.highter);
        }
    };

    p.deleteHighlighter = function() {
        if (this.displayObj && !!this.displayObj.shadow) {
            this.displayObj.shadow = null;
        }

        if (TQ.Config.useHighlightBox) {
            if (!this.highter) {
                return;
            }

            stageContainer.removeChild(this.highter);
            this.highter = null;
        }
    };

    p.updateHighlighter = function() {
        if (this._isHighlighting && this.createHighlighter) {
            this.deleteHighlighter();
            this.createHighlighter();
        } else {
            this.deleteHighlighter();
        }
    };

    p.createBBox = function(sx, sy, rotation, w, h) {
        var shape = new createjs.Shape();
        shape.rotation = rotation;
        var pos = this.getPositionInDc();
        var graph = shape.graphics;
        var x1 = 0,
            y1 = 0,
            x2 = w,
            y2 = h;

        var pts = [
            [x1, y1],
            [x2, y1],
            [x2, y2],
            [x1, y2],
            [x1, y1]
        ];

        var m_trans = TQ.Matrix2D.translation(-x1, -y1),
            m_rotate = TQ.Matrix2D.transformation(0, 0, rotation, sx, sy),
            m_trans2 = TQ.Matrix2D.translation(x1, y1),
            m_all;
        // m_all = m_trans.multiply(m_rotate);
        // m_all = m_all.multiply(m_trans2);

        m_all = m_trans2.multiply(m_rotate);
        m_all = m_all.multiply(m_trans);
        graph.clear();
        graph.beginStroke("#F00");
        graph.moveTo(pts[0][0], pts[0][1]);
        for (i = 0; i < pts.length; i++) {
            var dp = m_all.multiply($V([pts[i][0], pts[i][1], 1])).elements;
            var x = pos.x + dp[0],
                y = pos.y + dp[1];

            if (i === 0) {
                graph.moveTo(x, y);
            } else {
                graph.lineTo(x, y);
            }
        }

        return shape;
    };

    p.pinIt = function () {
        if (!this.jsonObj.isPinned) {
            this.jsonObj.isPinned = true;
        } else {
            this.jsonObj.isPinned = false;
        }

        TQ.DirtyFlag.setElement(this);
        if (this.jsonObj.type == "Group") {
            for (var i = 0; i < this.children.length; i++) {
                var ele = this.children[i];
                if (!ele.isJoint()) ele.pinIt(); // 钉住Group， 但是， 不要钉住关节物体
            }
        }
    };

    Element.getShadow = function () {
        if (!Element._shadow) {
            Element._shadow = new createjs.Shadow('#000000', 1, 1, 10);
        }
        return Element._shadow;
    };

    p._afterItemLoaded = function (resource) {
        this.fillGap2();
        if (this.autoFitFlag && !this.isMarker() && !this.isVirtualObject()) {
            this.autoFit(resource);
        }

        if (this.isNewlyAdded) {
            this.forceToRecord();
        }

        if (this.displayObj) { //声音元素， 没有displayObj
            this.displayObj.isClipPoint = this.jsonObj.isClipPoint;
        }
        this.animeTrack = this.jsonObj.animeTrack;
        if (this.level.isStageReady()) {
            if (this.jsonObj.t0 != undefined) { // 必须是在 立即插入模式
                if (!this.jsonObj.isVis) {
                    TQ.AnimeTrack.hide(this, this.jsonObj.t0); // 适合于3D视图，长期隐藏
                } else {
                    TQ.AnimeTrack.hideToNow(this, this.jsonObj.t0);
                }
            }
        }

        if ((this._isNewSkin)) { // 编程哲学: 多少 是, 少用 非, 复合一般人的思维逻辑, 通顺.
            TQ.Log.out("element._afterItemLoaded"); // , 应该只在临时添加的时候, 才调用
            assertTrue(TQ.Dictionary.INVALID_LOGIC, false); // 应该只在临时添加的时候, 才调用
            TQ.StageBuffer.add(this); // 统一进入 stage的渠道.
            if ((this.jsonObj.zIndex != null) && (this.jsonObj.zIndex >= 0)) { // 原来是group, 没有皮肤, 所以是-1;
                stageContainer.setChildIndex(this.displayObj, this.jsonObj.zIndex + 1); //ToDo: 为什么要加1 组合体才正确?
            }
            this._isNewSkin = false;
        } else {
            this.level.onItemLoaded(this);
        }
        this.setFlag(Element.LOADED);
    };

    Element.compare = function (e1, e2) {
        assertNotNull(e1);
        assertNotNull(e2);
        var id1 = e1.jsonObj.zIndex;
        var id2 = e2.jsonObj.zIndex;
        // 凡是出错的地方, 加一道检查,让它主动报错
        assertTrue(TQ.Dictionary.INVALID_LOGIC, id1 >= -1); // group元素, 没有显示物, 所以是-1,
        assertTrue(TQ.Dictionary.INVALID_LOGIC, id2 >= -1); // 元素的可见性顺序 >= -1
        return id1 - id2;
    };

    p.sort = function () {
        this.children.sort(TQ.Element.compare);
    };

    p.toJSON = function () {
        if (!this.jsonObj) {
            return null;
        }
        this.highlight(false);
        var data = TQ.Base.Utility.shadowCopy(this.jsonObj);
        //备注：displayObj 本身里面有Cycle， 无法消除。所以必须让他null。
        // JQuery 调用的toJSON， 只需要这个字段即可， 一定不要在这里调用stringify！
        data.displayObj = null;
        data.animeTrack = this.animeTrack;
        data.animeCtrl = this.animeCtrl;
        data.viewCtrl = this.viewCtrl;
        data.state = (this.state & 0x1F); // 去除高位的动态的flag，不会永久存储到wdm文件中。

        // 保存为相对路径
        if (!!data.src) {
            data.src = TQ.RM.toRelativeWithoutCache(data.src);
        }

        data.IM = null;
        data.M = null;

        if (this.trace) {
            data.trace = this.trace;
        }

        //输出孩子的资源
        if (this.children != null) {
            data.children = [];
            for (var i = 0; i < this.children.length; i++) {
                if (!this.children[i].isMarker()) {
                    data.children.push(this.children[i].toJSON());
                }
            }
        }

        // 如果要输出多个字段， 可以采用下面的方式： 不带字段名称， 用数组； 用{}可以自定义字段显示名称
        // [this.jsonObj, this.animeTrack];
        // {"jsonObj":this.jsonObj, "animeTrack": this.animeTrack};
        this.jsonData = data;
        return data;
    };

    p.afterToJSON = function () {
        if (this.isMarker()) {
            return;
        }
        var data = this.jsonData;
        this.jsonData = null;
        //  只是为了输出, 才临时赋值给它, 现在收回.
        data.animeTrack = null;
        data.animeCtrl = null;
        data.viewCtrl = null;
        data.trace = null;
        data.children.splice(0);
        if (this.children != null) {
            for (var i = 0; i < this.children.length; i++) {
                this.children[i].afterToJSON();
            }
        }
    };

    p.isUserControlling = function () {
        // 鼠标右键按下, 就是操作 (不论是否move.
        // 注意: Mousemove事件只在鼠标移动时候发出.  不移动就不发出, 即使 鼠标一直按住该物体.
        return (TQ.InputMap.IsOperating() && TQ.SelectSet.isSelected(this));
    };

    p.attachCtrl = function (controller) {
        this.animeCtrl = controller;
        this.animeCtrl.play("idle");  // 设置缺省的 动作
    };

    p.addAction = function (name, startFrame, endFrame, repeatStyle, gifIconID, forceToUpdate) {
        if (!this.animeCtrl) {
            this.animeCtrl = new TQ.Animation(null);
        }
        var action = new TQ.Action(name, parseInt(startFrame), parseInt(endFrame), repeatStyle, parseInt(gifIconID));
        return this.animeCtrl.addAction(action, forceToUpdate);
    };

    p.deleteAction = function (name) {
        if (!this.animeCtrl) {
            assertTrue(TQ.Dictionary.INVALID_LOGIC, this.animeCtrl);
            return;
        }

        this.animeCtrl.deleteAction(name);
    };

    p.hasAction = function (actionName) {
        if (!this.animeCtrl) {
            assertTrue(TQ.Dictionary.INVALID_LOGIC, this.animeCtrl);
            return false;
        }

        return this.animeCtrl.hasAction(actionName);
    };

    p.stop = function() {
        if (this.animeCtrl) {
            this.animeCtrl.stop();
        }
        // do no thing for bitmap
    };

    p.play = function() {
    };

    p.playAction = function (name, playByUpdate) {
        if (!this._controlerInst) {
            this._controlerInst = this.getFirstAnimeCtrl();
        }
        if (!this._controlerInst) return;
        this._controlerInst.play(name);
        if (!playByUpdate) {
            this.setFlag(TQ.Element.ACTION_CHANGED);
            TQ.ActionRecorder.record(this, name, TQ.FrameCounter.t());
            if (!TQ.FrameCounter.isPlaying()) {
                $('#play').click();
            }
        }
    };

    p.getActionSet = function () {
        var controller = this.getFirstAnimeCtrl();
        if (controller != null) {
            return controller.actionTable;
        }

        return null;
    };

    //ToDo: 这里假设一个元件中, 只有一个animeCtrl. 这是一个限制, 以后需要支持多个
    p.getFirstAnimeCtrl = function () {
        if (!!this.animeCtrl) {
            return this.animeCtrl;
        }

        var result = null;
        if (!!this.children) {
            for (var i = 0; i < this.children.length; i++) {
                result = this.children[i].getFirstAnimeCtrl();
                if (!result) continue;
                break;
            }
        }

        return result;
    };

    p.updateAction = function (t) {
        if (!this.hasActionTrack()) return;

        //ToDo: 可以解除限制， 支持多套动作， 例如： 脸部动作， 肢体动作， 嘴巴动作等
        // 方法是： 每套动作， 对应一个animeTrack和一个Controller，i.e. 把下面的内容归到各个controller
        var newName = TQ.ActionDecoder.calculate(this.animeTrack, t);
        var isNewAction = false;
        if (!this.currentActionName) {
            this.currentActionName = newName;
            isNewAction = true;
        } else if (this.currentActionName != newName) {
            this.currentActionName = newName;
            isNewAction = true;
        }

        if (isNewAction) {
            this.playAction(this.currentActionName, true);
        }
    };

    p.update = function (t, noRecording) {
        noRecording = !!noRecording;
        var justRecorded = false;
        if (!this.isLoaded()) return;

        TQ.Log.debugInfo("update: " + (noRecording?"NR ":"") + this.jsonObj.type + this.id + ", t = " + t + "(x,y) = " + this.jsonObj.x + ", " + this.jsonObj.y);
        if (this.hasActionTrack()) { // 更新使用者的动作track，
            this.updateAction(t);
        }

        if (this.animeCtrl) { // 更新 拥有者的 时间
            if (this.animeCtrl.currentAction) {
                t = this.animeCtrl.currentAction.tMapping(t);
            }
        }

        // 如果有拍摄, 先拍摄
        var parentPose = (null == this.parent) ? null : this.parent.jsonObj;
        var motionType = 0; // 没有变化, 使用上一个时刻的 世界坐标
        if (!noRecording && this.allowRecording() && !TQBase.LevelState.isOperatingTimerUI()) {
            if (this.dirty2 || this.isUserControlling()) {
                TQ.Log.debugInfo("update: Record, lastOperationFlag =" + TQBase.Trsa.lastOperationFlag);
                if (!this.getOperationFlags()) {  // 鼠标按住, 但是 没有移动, 单独确定操作状态
                    this.setFlag(TQBase.Trsa.lastOperationFlag);
                    // TQ.Log.out("操作: " + TQBase.Trsa.lastOperationFlag +"last");
                }
                //  不能在此记录, 因为, Move, Rotate操作的时候, 不调用它update
                TQ.Pose.worldToObjectExt(this.jsonObj, parentPose);
                TQ.Assert.isTrue(!isNaN(TQ.Pose.x), "x 为 NaN！！！");
                TQ.Assert.isTrue(!isNaN(TQ.Pose.y), "y 为 NaN！！！");
                // 记录修改值
                TQ.TrackRecorder.record(this, t);
                justRecorded = true;
                motionType += 0x02;
            }
        }

        // 播放过程:
        // 1) 生成世界坐标:
        parentPose = (null == this.parent) ? null : this.parent.jsonObj;
        if (this.hasAnimation()) { //  动画物体
            // 即使是 用户操作的物体, 也需要重新生成, 因为用户只操作了其中的几个轨道,
            //  而其余的轨道, 仍然需要使用原来的数据,
            // 当然, 此刻的计算,一是为此刻的显示, 二是为下一时刻的修改. 两用的.
            // 1.1A) 从动画轨迹 到物体坐标
            // 如果有动画数据, 才需要解码,生成新的 世界坐标. 否则,跳过
            // 先生成新的 物体坐标(TQ.Pose), 再转化到世界坐标系
            TQ.Log.debugInfo("update: regenerate coordinates 1: hasAnimation");
            var tt = t;
            if (justRecorded && (TQ.TrackRecorder.style == TQ.TrackDecoder.JUMP_INTERPOLATION)) {
                tt = t + 0.01; // 在脉冲运动下，迫使系统采用最新的位置
            }
            if (this.isSound() && this.isMultiScene) {//支持跨场景的声音
                tt = currScene.toGlobalTime(tt);
            }
            TQ.TrackDecoder.calculate(this.animeTrack, tt); // 计算结果在Pose中，是 物体坐标系的）
            // 1.1B): 从物体坐标 TQ.Pose. 到世界坐标
            TQ.Pose._toWorldCoordinate(this.jsonObj, parentPose);
            motionType += 0x04;
        } else if (this.isMarker()) {
            TQ.Log.debugInfo("update: regenerate coordinates 2: is Marker");
            this.jsonObj.x = 0;
            this.jsonObj.y = 0;
            this.jsonObj.rotation = 0;
            this.jsonObj.sx = 1;
            this.jsonObj.sy = 1;
            TQ.Pose.updateM(this.jsonObj, parentPose);
            var pObjectSpace = {x: 0, y: 0};
            var pWorld = this.object2World(pObjectSpace);
            this.jsonObj.x = pWorld.x;
            this.jsonObj.y = pWorld.y;
        } else if ((motionType == 0) && this.dirty) {
            // 1.2) 但是, 如果父物体移动了, 它也被动地被要更新
            TQ.Log.debugInfo("update: regenerate coordinates 3: 被动更新");
            TQ.Pose.worldToObjectExt(this.jsonObj, parentPose);
            TQ.Pose._toWorldCoordinate(this.jsonObj, parentPose);
        }

        // 1.3) 没有动画的物体, 也没有被操作,被移动, jsonObj 已经是世界坐标

        // 2) 从世界坐标 到 设备坐标
        this.setTRSAVZ();
        var debugON = false;
        if (debugON) {
            if ((stage.selectedItem != null) && (stage.selectedItem.id == this.displayObj.id)) {
                var sels = TQ.Dictionary.Selected + stage.selectedItem.id;
                //  值显示选中的物体:
                displayInfo2(sels + "本物体id:" + this.displayObj.id + "motionType: " + motionType + " Pose: " + TQ.Pose.x + "," + TQ.Pose.y + "," +
                        "jsonObjXY:" + this.jsonObj.x + ", " + this.jsonObj.y +
                        "displayObjXY:" + this.displayObj.x + ", " + this.displayObj.y
                );
            }
        }

        if (this.jsonObj.isClipPoint == false) {
            assertArray(TQ.Dictionary.INVALID_LOGIC, this.children); // "children可以是空数组[], 但不能为null，或undefined"
            for (var i = 0; i < this.children.length; i++) {
                // 传播dirty标志, 迫使child更新; dirty2的子关节不记录track
                if (this.dirty || this.dirty2) this.children[i].dirty = true;
                if (!(this.isMarker() && this.children[i].isUserControlling())) {
                    TQ.Log.debugInfo("update children");
                    this.children[i].update(t, true); // 对孩子的传播，都是被动的，纯更新，不记录。
                }
            }
        }

        this.updateHighlighter();
        this.dirty = this.dirty2 = false;

        if (this.hookInMove) {
            this.hookInMove.call(this, this);
        }
    };

    // Marker 专用部分
    p.calPivot = function (ptWorld) {
        // 应该获取原始的 宽度和 高度， 在物体空间（也是原始的），来计算pivot值
        // 数据模型中的pivot永远是[0,1]规范化的， 在显示的时候转为createJS的像素格式
        var dpObject = this.world2Object(ptWorld),
            dx = dpObject.x / this.getWidth(),
            dy = dpObject.y / this.getHeight();
        return {pivotX: this.jsonObj.pivotX + dx, pivotY: this.jsonObj.pivotY + dy};
    };

    p.movePivot = function (pivot, ptWorld, marker) {
        TQ.Log.debugInfo("movePivot: ptWorld.x = " + ptWorld.x);
        this.moveTo(ptWorld);
        this.update(TQ.FrameCounter.t()); // 必须单独更新， 否则与pivot一起更新会不准确

        this.jsonObj.pivotX = pivot.pivotX;
        this.jsonObj.pivotY = pivot.pivotY;

        this.dirty = true;
    };

    p._move_TBD_NOT_USED = function (dx, dy) {
        this.jsonObj.x += dx;
        this.jsonObj.y += dy;
        this.setFlag(Element.TRANSLATING);
    };

    p.snapIt = function () {
        if (TQ.Config.snapOn) {
            var ptWorld = this.getPositionInWorld();
            ptWorld.x = Math.round(ptWorld.x / TQ.Config.snapDX) * TQ.Config.snapDX;
            ptWorld.y = Math.round(ptWorld.y / TQ.Config.snapDY) * TQ.Config.snapDY;
            this.moveTo(ptWorld);
        }
    };

    function snapAngle(angle) {
        // 角度钳制： 如果非常靠近90度的整数倍，则取该度数
        if (TQ.Config.snapAngleOn) {
            var k = angle/90,
                kRound = Math.round(k),
                toloerance = (k - kRound);
            if (Math.abs(toloerance) < 0.05) {
                angle = kRound * 90;
            }
        }

        return angle;
    }

    p.moveTo = function (ptWorld) {
        if (this.isPinned()) {
            return;
        }

        TQ.Assert.isTrue(!isNaN(ptWorld.x),  "x 为 NaN！！！");
        TQ.Assert.isTrue(!isNaN(ptWorld.y),  "y 为 NaN！！！");

        this.jsonObj.x = ptWorld.x;
        this.jsonObj.y = ptWorld.y;

        TQBase.LevelState.saveOperation(TQBase.LevelState.OP_CANVAS);
        this.setFlag(Element.TRANSLATING);
        TQ.DirtyFlag.setElement(this);
        this.dirty2 = true;
    };


    p.getScaleInNdc = function () {
        return {sx: this.jsonObj.sx, sy: this.jsonObj.sy};
    };

    p.getRotation = function () {
        return this.jsonObj.rotation;
    };

    p.rotateTo = function (angle) {
        if (this.isPinned()) {
            return;
        }

        this.jsonObj.rotation = snapAngle(angle);
        TQBase.LevelState.saveOperation(TQBase.LevelState.OP_CANVAS);
        this.setFlag(Element.ROTATING);
        TQ.DirtyFlag.setElement(this);
        this.dirty2 = true;
    };

    p.scaleTo = function (scaleInWorld) {
        if (this.isPinned()) {
            return;
        }

        TQ.Assert.isTrue(!isNaN(scaleInWorld.sx),  "x 为 NaN！！！");
        TQ.Assert.isTrue(!isNaN(scaleInWorld.sy),  "y 为 NaN！！！");

        this.jsonObj.sx = scaleInWorld.sx;
        this.jsonObj.sy = scaleInWorld.sy;
        TQBase.LevelState.saveOperation(TQBase.LevelState.OP_CANVAS);
        this.setFlag(Element.SCALING);
        TQ.DirtyFlag.setElement(this);
        this.dirty2 = true;
    };

    p.scaleAndRotateTo = function (scaleAndRotate) {
        TQ.Assert.isTrue((scaleAndRotate.angle !== undefined) &&
            (scaleAndRotate.scale != undefined), "参数取值错误");
        this.rotateTo(scaleAndRotate.angle);
        this.scaleTo(scaleAndRotate.scale);
    };

    p.scale = function (scale) {
        var scaleTo = {};
        scaleTo.sx = scale * this.jsonObj.sx;
        scaleTo.sy = scale * this.jsonObj.sy;
        this.scaleTo(scaleTo);
    };

    p.updateDecorations = function (t) {
        if (!this.decorations) {
            return; // 例如: 本身是decoration, 没有其他decoration
        }
        for (var i = 0; i < this.decorations.length; i++) {
            var dec = this.decorations[i];
            if (!dec) continue;
            dec.update2(t);
        }
    };

    p.applyToDecorations = function () {
        if (!this.decorations) {
            return; // 例如: 本身是decoration, 没有其他decoration
        }
        for (var i = 0; i < this.decorations.length; i++) {
            var dec = this.decorations[i];
            if ((dec != null) && dec.isUserControlling()) { // 迫使Market重新计算， Marker没有动画, 永远都在pivot点
                dec.apply(this);
            }
        }
    };

    p.calculateLastFrame = function () {
        var tMax = 0;
        if (!!this.animeTrack) {
            tMax = Math.max(tMax, TQ.AnimeTrack.calculateLastFrame(this.animeTrack));
        }

        if (!!p.children) {
            for (var i = 0; i < p.children.length; i++) {
                tMax = Math.max(tMax, p.children[i].calculateLastFrame());
            }
        }

        return tMax
    };

    // upgrade 工具：
    Element.upgrade = function (jsonStr) {
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

        //相对路径和绝对路径的映射，统一到RM管理
        return jsonStr;
    };

    // 小函数区域: has, is, 这些函数容易理解, 放到最后, 让重要的函数, 需要经常看的函数,放到前面
    p.setText = function (htmlStr) {
        assertDepreciated(TQ.Dictionary.isDepreciated + "， 移到了text元素中！");
    };

    p.hasAnimation = function () {
        return (!((this.animeTrack == undefined) || (this.animeTrack == null)));
    };

    p.isLoaded = function () {
        return this.loaded;
    };

    p.isClipPoint = function () {
        return this.jsonObj.isClipPoint;
    };

    p.isBitmap = function () {
        return (!!this.displayObj && (this.displayObj instanceof createjs.Bitmap));
    };

    p.isText = function () {
        return false;
    };
    p.isSound = function () {
        return (this.jsonObj.type == "SOUND");
    };
    p.isGroupFile = function () {
        return (this.jsonObj.type == "GroupFile");
    };
    p.isButton = function () {
        return false;
    };
    p.isSelectable = function() {
        return true;
    };
    p.getTextHtml = function () {
        assertTrue(TQ.Dictionary.INVALID_PARAMETER, this.isText());
        return this.toHtmlStr();
    }; // 必须是Text
    p.getFont = function () {
        assertTrue(TQ.Dictionary.INVALID_PARAMETER, this.isText());
        return this.jsonObj.font;
    }; //必须是Text
    p.isLeaf = function () {
        return ((this.children == null) || (this.children.length < 1));
    };
    p.isRoot = function () {
        return (this.hasFlag(Element.ROOT_JOINT));
    };
    p.isJoint = function () {
        return ((this.parent != null) && (this.hasFlag(Element.JOINTED)));
    };
    p.isFEeffect = function() {
        return false;
    };
    p.isMarker = function () {
        return false;
    };
    p.isVirtualObject = function () { // 虚拟物体包括： Group(displayObj 非空), 声音(displayObj 为空)，等
        if (!this.displayObj) {
            return this.isSound();
        }
        assertNotNull(TQ.Dictionary.FoundNull, this.displayObj); // 应该有可显示对象
        return ((this.displayObj.image == null) && (this.jsonObj.type == "Group"));
    };
    p.isValid = function () { // 非法的物体包括: 被删除的物体
        return (this.jsonObj || this.displayObj);
    };
    p.isPinned = function () {
        return ( this.jsonObj.isPinned);
    };
    p.isVisible = function () {
        if (!this.displayObj) {
            return this.visibleTemp;
        } else if (!this.displayObj.visible) {
            return this.visibleTemp;
        }
        return this.displayObj.visible;
    };
    p.hasBroken = function () {
        return (this.hasFlag(Element.BROKEN));
    };
    p.isGrouped = function () {
        return ((this.jsonObj.type === DescType.GROUP) ||
        (this.jsonObj.type === DescType.GROUP_FILE));
    };

    p.isVer2plus = function() {
        return ((this.version === TQ.Element.VER2) ||
                ((typeof this.version === 'number') && (this.version >= Element.VER3)));
    };

    p.getRoot = function () {  // 任何时候, 都是root, 唯一化
        if (this.isGrouped()) {
            if (this.parent != null) return this.parent.getRoot();
        }
        return this;
    };

    p.setMinAngle = function (newValue) {
        this.jsonObj.angleMin = newValue;
    };
    p.setMaxAngle = function (newValue) {
        this.jsonObj.angleMax = newValue;
    };
    p.moveZ = function (step) {
        TQ.MoveCtrl.cmdMoveLayer(this, step);
    };
    p.moveToZ = function (newZ) {
        this.moveZ(newZ - this.getZ());
    };
    p.getType = function () {
        return (this.jsonObj.type);
    };
    p.getEType = function () {
        return (this.jsonObj.eType);
    };
    p.setFlag = function (flag) {
        this.state |= flag;
    };
    p.clearFlag = function (flag) {
        this.state &= ~flag;
    };
    p.hasFlag = function (flag) {
        return this.state & flag;
    };
    p.hasActionTrack = function () {
        return (this.animeTrack && this.animeTrack.action);
    };
    p.allowRecording = function () {
        return true; // 缺省下， 所有元素都支持recording，
    };
    p.getOperationFlags = function () {
        return (this.state & 0xFFF0);
    };
    p.getAlias = function () {
        return null;
    };
    p.getZ = function () { //如果是没有Z值的(例如:Group,等), 则返回其首个有Z值孩子的值
        // 只是被 moveLayer命令的undo使用, 没有用于物体顺序的保存
        var target = this.displayObj;
        var z = (!target) ? -1 : stageContainer.getChildIndex(target);
        if (z >= 0) {
            return z
        }
        if (this.children) {
            for (var i = 0; i < this.children.length; i++) {
                z = this.children[i].getZ();
                if (z >= 0) {
                    return z
                }
            }
        }

        assertTrue(TQ.INVALID_LOGIC + "没有可见物体的group", false);
        return z;
    };

    p.getColor = function() {
        return (this.jsonObj.color === undefined) ? TQ.Config.color : this.jsonObj.color;
    };

    TQ.Element = Element;
    TQ.Element.DescType = DescType;
}());
