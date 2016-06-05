/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 */
window.TQ = window.TQ || {};

(function () {
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
            if (!!desc.autoFit) {
                this.autoFitFlag = desc.autoFit;
            } else {
                this.autoFitFlag = false;
            }
            delete(desc.autoFit);
            this.initialize(desc);
        }
    }

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
    Element.TYPE_AUDIO = 11; // 声音

    Element.TO_RELATIVE_POSE = (Element.TRANSLATING | Element.ROTATING | Element.SCALING
        | Element.ZING | Element.ALPHAING);  //  在组成Group, Joint, 显示 Pivot Marker的时候需要.
    Element.CLEAR_ANIMATATION = 0x8000; //清除全部track, 重新记录;
    Element.IN_STAGE = 0x10000; // 加入到了Stage;
    Element.LOADED = 0x20000; //

    Element.showHidenObjectFlag = false;  //  个人的state由个人记录, 上级可以控制
    var p = Element.prototype;
    p.loaded = false;
    p.jsonObj = null;
    p.displayObj = null;
    p.parent = null;
    p.children = [];  //  注意： 缺省是空数组， 不是null， 确保每一个参数都有缺省值！！！
    p.animeTrack = {}; // 只是数组指针, 和jsonObj 共用数据, 没有重复

    p.show = function (isVisible) {
        if (this.displayObj == undefined) return;
        this.jsonObj.isVis = isVisible;
        if (this.jsonObj.isVis && !this.hasFlag(Element.IN_STAGE)) {
            TQ.Log.out(TQ.Dictionary.INVALID_LOGIC); // show + _doAddItemToStage 飞线, 适用于: 1) load之时不可见的元素, 2) marker初次创建时, 不可见
            TQ.StageBuffer.add(this);
        }
        //ToDo: 留给显示函数做, 不能一竿子插到底,  this.displayObj.visible = isVisible;
        this.dirty2 = true;
        this.setFlag(Element.VISIBLE_CHANGED);

        // show命令， 只是改变这个实体本身的可见性标志，不能直接传遍所有孩子。
        // 其孩子的实际可见性 = 父物体实际可见性 && 孩子的可见性标志 ，
        // 详细见： setTRSAVZ() 和 isVisible()
    };

    p.toggleVisibility = function () {
        this.show(!this.jsonObj.isVis);
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
            case "GroupFile" :
                this._addComponent(desc);
                break;
            case "Text" :
                this.load(desc);
                break;
            case "Group" :
                this.load(desc);
                break;
            case "Bitmap":
                this.load(desc);
                break;
            case "SOUND" :
                this.load(desc);
                break;
            case "BitmapAnimation":
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
            desc.pivotX = 0;// (desc.pivotX == undefined) ? TQ.Config.TEXT_PIVOT_X : desc.pivotX;
            desc.pivotY = 1; // (desc.pivotY == undefined) ? TQ.Config.TEXT_PIVOT_Y : desc.pivotY;
        } else {
            desc.pivotX = (desc.pivotX == undefined) ? TQ.Config.pivotX : desc.pivotX;
            desc.pivotY = (desc.pivotY == undefined) ? TQ.Config.pivotY : desc.pivotY;
        }

        if (desc.sx == undefined) {
            desc.sx = 1;
        }

        if (desc.sy == undefined) {
            desc.sy = 1;
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
            case "BitmapAnimation":
                this._loadActor();
                break;
            case "Group":
                this._loadComponent();
                break;
            case "JointMarker":
                this._loadMarker();
                break;
            case "Text":
            case "SOUND":
            case "Bitmap":
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

        ele.setFlag(Element.JOINTED);
        this.addChild(ele);
        this.dirty2 = true;
    };

    p.addChild = function (desc) {
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

            TQ.DirtyFlag.setElement(this);
            child.dirty2 = this.dirty2 = true;  // 迫使系统更新child的位置数据位相对坐标
            child.setFlag(Element.TO_RELATIVE_POSE);

        } else {
            child = Element.build(this.level, desc);
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
            this.update(p.t);
        }
    };

    p.saveWorldData = function (worldData, track, type) {
        //ToDo: 先计算所有parent的pose，再计算它的pose
        for (var i = 0; i < track.t.length; i++) {
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
        TQ.DirtyFlag.setElement(this);
        child.dirty2 = this.dirty2 = true;  // 迫使系统更新child的位置数据位相对坐标
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
        this.decorations = decs;
        // ToDo: 处理每一个Marker
        var marker = this.decorations[0];
        marker.host = this;
        marker.level = this.level;
        marker.attach();
        marker.createImage();
        this.dirty2 = marker.dirty2 = true;
        marker.setFlag(Element.TO_RELATIVE_POSE | Element.CLEAR_ANIMATATION); // 迫使他记录所有的track,
        this.addChild(marker);
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
        if (this.autoFitFlag) {
            this.autoFit(resource);
        }
        this.displayObj = new createjs.Bitmap(resource);
        this._afterItemLoaded();
        this.setTRSAVZ();
        TQ.DirtyFlag.setElement(this);
    };

    p.autoFit = function(img) {
        // 自动充满整个画面 或者 保持物体的原始大小
        var scaleX = 1 / img.naturalWidth,
            scaleY = 1 / img.naturalHeight;
        var desc = this.jsonObj;
        desc.x = 0.5;
        desc.y = 0.5;
        desc.sx = scaleX;
        desc.sy = scaleY;
        desc.rotation = 0;
        desc.pivotX = 0.5;
        desc.pivotY = 0.5;
        var obj_pdc = this.ndc2Pdc(desc);
        if (this.autoFitFlag === Element.FitFlag.KEEP_SIZE) {
            obj_pdc.sx = 1;
            obj_pdc.sy = 1;
        }
        this.scaleTo(obj_pdc);
        this.moveTo(obj_pdc);
        // desc.pivotX = desc.pivotY = 0.5;
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

    p.setNdc = function(obj) {
        obj.x = 0.5;
        obj.y = 0.5;
        obj.sx = 1 / this.getWidth();
        obj.sy = 1 / this.getHeight();
    },

    p.ndc2Pdc = function(obj) {
        var sx = TQ.Config.workingRegionWidth,
            sy = TQ.Config.workingRegionHeight;

        var obj_pdc = {
            x: obj.x * sx,
            y: obj.y * sy,
            sx: obj.sx * sx,
            sy: obj.sy * sy,
            fontSize : (!obj.fontSize)? 0 : obj.fontSize * sx,
            rotation : obj.rotation,
            pivotX : obj.pivotX,
            pivotY : obj.pivotY
        };

        return obj_pdc;
    };

    p.pdc2Ndc = function(obj) {
        this.justMoved = true;
        var sx = 1/TQ.Config.workingRegionWidth,
            sy = 1/TQ.Config.workingRegionHeight;

        var obj_ndc = {
            x: (!obj.x)? Number.NaN : obj.x * sx,
            y: (!obj.y)? Number.NaN : obj.y * sy,
            sx: (!obj.sx)? 1: obj.sx * sx,
            sy: (!obj.sy)? 1: obj.sy * sy,
            fontSize : (!obj.fontSize)? 0:obj.fontSize * sx,
            rotation : (!obj.rotation)? 0: obj.rotation,
            pivotX : (!obj.pivotX)? 0: obj.pivotX,
            pivotY : (!obj.pivotY)? 0:obj.pivotY
        };

        return obj_ndc;
    };

    p.doShow = function (visSum) {
        if (!this.displayObj) {
            this.visibleTemp = visSum;
        } else {
            this.displayObj.visible = visSum;
            this.toDeviceCoord(this.displayObj, this.jsonObj);
        }
    };

    p.toDeviceCoord = function (displayObj, jsonObj) {
        if (!this.justMoved) {
            // this.setNdc(this.jsonObj);
        }
        this.justMoved = false;
        var obj_pdc = this.ndc2Pdc(this.jsonObj);
        var obj_dc = this.pdc2dc(obj_pdc);
        displayObj.x = obj_dc.x;
        displayObj.y = obj_dc.y;
        displayObj.scaleX = obj_dc.scaleX;
        displayObj.scaleY = obj_dc.scaleY;
        displayObj.regX = obj_dc.regX;
        displayObj.regY = obj_dc.regY;
        displayObj.rotation = obj_dc.rotation;
    };

    p.pdc2dc = function(obj_pdc) {
        assertValid(TQ.Dictionary.FoundNull, obj_pdc); // 应有显示数据

        var obj_dc = {};
        //从 用户使用的世界坐标和物体坐标，转换为可以绘制用的设备坐标
        if (!obj_pdc) {
            return;
        }
        obj_dc.x = TQ.Config.zoomX * obj_pdc.x;
        obj_dc.y = TQ.Utility.toDeviceCoord(TQ.Config.zoomY * obj_pdc.y);
        if (this.isMarker() || this.isSound()) { // marker 永远是一样的大小, 圆的, 没有旋转, 定位在圆心.
            obj_dc.scaleX = obj_dc.scaleY = 1;
            obj_dc.regX = obj_dc.regY = 0;
            obj_dc.rotation = 0;
            return;
        }
        if (!this.isMarker()) {
            obj_dc.regX = obj_pdc.pivotX * this.getWidth();
            obj_dc.regY = TQ.Utility.toDevicePivot(obj_pdc.pivotY) * this.getHeight();
        } else {
            obj_dc.regX = 0;
            obj_dc.regY = 0
        }

        obj_dc.rotation = TQ.Utility.toDeviceRotation(obj_pdc.rotation);
        obj_dc.scaleX = TQ.Config.zoomX * obj_pdc.sx;
        obj_dc.scaleY = TQ.Config.zoomY * obj_pdc.sy;
        return obj_dc;
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
        this._afterItemLoaded();
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
        TQ.TraceMgr.removeFromStage(this);
        if (this.displayObj) {
            stageContainer.removeChild(this.displayObj);
        }
        this.clearFlag(Element.IN_STAGE);
        TQ.DirtyFlag.setElement(this);
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
                            TQBase.Trsa.do(ele2, thislevel, offset, ev, stageContainer.selectedItem);
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

        this._isHighlighting = enable;
        if (this._isHighlighting) {
            this.createHighlighter();
        } else {
            this.deleteHighlighter();
        }
    };

    p.createHighlighter = function() {
        this.displayObj.shadow = Element.getShadow();
    };

    p.deleteHighlighter = function() {
        this.displayObj.shadow = null;
    };

    p.pinIt = function () {
        if (!this.jsonObj.isPinned) {
            this.jsonObj.isPinned = true;
        } else {
            this.jsonObj.isPinned = false;
        }

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

    p._afterItemLoaded = function () {
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
        var data = TQ.Base.Utility.shadowCopy(this.jsonObj);
        //备注：displayObj 本身里面有Cycle， 无法消除。所以必须让他null。
        // JQuery 调用的toJSON， 只需要这个字段即可， 一定不要在这里调用stringify！
        this.highlight(false);
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
                data.children.push(this.children[i].toJSON());
            }
        }

        // 如果要输出多个字段， 可以采用下面的方式： 不带字段名称， 用数组； 用{}可以自定义字段显示名称
        // [this.jsonObj, this.animeTrack];
        // {"jsonObj":this.jsonObj, "animeTrack": this.animeTrack};
        this.jsonData = data;
        return data;
    };

    p.afterToJSON = function () {
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

    p.update = function (t) {
        var justRecorded = false;
        if (!this.isLoaded()) return;

        if (this.hasActionTrack()) { // 更新使用者的动作track，
            this.updateAction(t);
        }

        if (this.animeCtrl) { // 更新 拥有者的 时间
            if (this.animeCtrl.currentAction) {
                t = this.animeCtrl.currentAction.tMapping(t);
            }
        }

        this.updateDecorations(t); //根据Marker，移动Pivot点
        // 如果有拍摄, 先拍摄
        var parentPose = (null == this.parent) ? null : this.parent.jsonObj;
        var motionType = 0; // 没有变化, 使用上一个时刻的 世界坐标
        if (!TQBase.LevelState.isOperatingTimerUI()) {
            if (this.dirty2 || this.isUserControlling()) {
                // TQ.Log.out("操作: " + TQBase.Trsa.lastOperationFlag);
                if (!this.getOperationFlags()) {  // 鼠标按住, 但是 没有移动, 单独确定操作状态
                    this.setFlag(TQBase.Trsa.lastOperationFlag);
                    // TQ.Log.out("操作: " + TQBase.Trsa.lastOperationFlag +"last");
                }
                //  不能在此记录, 因为, Move, Rotate操作的时候, 不调用它update
                TQ.Pose.worldToObjectExt(this.jsonObj, parentPose);
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
            var tt = t;
            if (justRecorded && (TQ.TrackRecorder.style == TQ.TrackDecoder.JUMP_INTERPOLATION)) {
                tt = t + 0.01; // 在脉冲运动下，迫使系统采用最新的位置
            }
            if (this.isSound() && this.isMultiScene) {//支持跨场景的声音
                tt = currScene.toGlobalTime(tt);
            }
            TQ.TrackDecoder.calculate(this.animeTrack, this.jsonObj, tt);
            // 1.1B): 从物体坐标 TQ.Pose. 到世界坐标
            TQ.Pose._toWorldCoordinate(this.jsonObj, parentPose);
            motionType += 0x04;
        } else if ((motionType == 0) && this.dirty) {
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
        var dPivotX = xObjectSpace / this.getWidth();
        var dPivotY = yObjectSpace / this.getHeight();
        return {pivotX: this.jsonObj.pivotX + dPivotX, pivotY: this.jsonObj.pivotY + dPivotY};
    };

    p.getWidth = function () {
        if (this.isVirtualObject()) {// 对于Group物体
            var w = 100;
        } else {
            w = this.displayObj.getWidth(true);
        }

        return w;
    };

    p.getHeight = function () {
        if (this.isVirtualObject()) {// 对于Group物体
            var h = 100;
        } else {
            h = this.displayObj.getHeight(true);
        }
        return h;
    };

    p.movePivot = function (pivot, pos, marker) {
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

    p._move_TBD_NOT_USED = function (dx, dy) {
        this.jsonObj.x += dx;
        this.jsonObj.y += dy;
        this.setFlag(Element.TRANSLATING);
    };

    p.moveTo = function (point) {
        var obj_ndc = this.pdc2Ndc(point);

        this.jsonObj.x = obj_ndc.x;
        this.jsonObj.y = obj_ndc.y;
        this.setFlag(Element.TRANSLATING);
        TQ.DirtyFlag.setElement(this);
        this.dirty2 = true;
    };

    p.getScale = function () {
        var obj_pdc = this.ndc2Pdc(this.jsonObj);
        return {sx: obj_pdc.sx, sy: obj_pdc.sy};
    };

    p.getRotation = function () {
        var obj_pdc = this.ndc2Pdc(this.jsonObj);
        return obj_pdc.rotation;
    };

    p.getPosition = function () {
        var obj_pdc = this.ndc2Pdc(this.jsonObj);
        return {x: obj_pdc.x, y: obj_pdc.y};
    };

    p.getPositionInDc = function () {
        var obj_pdc = this.ndc2Pdc(this.jsonObj);
        var obj_dc = this.pdc2dc(obj_pdc);
        return {x: obj_dc.x, y: obj_dc.y};
    };

    p.rotateTo = function (angle) {
        this.jsonObj.rotation = angle;
        this.setFlag(Element.ROTATING);
        TQ.DirtyFlag.setElement(this);
        this.dirty2 = true;
    };

    p.scaleTo = function (scale) {
        var obj_ndc = this.pdc2Ndc(scale);
        this.jsonObj.sx = obj_ndc.sx;
        this.jsonObj.sy = obj_ndc.sy;
        this.setFlag(Element.SCALING);
        TQ.DirtyFlag.setElement(this);
        this.dirty2 = true;
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
    p.isText = function () {
        return (this.jsonObj.text != undefined);
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
    p.isMarker = function () {
        return (this.jsonObj.type == "JointMarker");
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
        if (this.children != null) {
            // assertTrue("如果非空, 必须有元素", this.children.length > 0);
        }
        return ((this.parent != null) || (this.children != null));
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

    TQ.ElementType = {
        BITMAP: "Bitmap",
        SOUND: "SOUND",
        TEXT: "Text",
        GROUP: "Group",
        GROUP_FILE: "GroupFile",
        BITMAP_ANIMATION: "BitmapAnimation"
    };

    Element.FitFlag = {
        KEEP_SIZE: 1,
        FULL_SCREEN: 2
    };

    TQ.Element = Element;
}());
