/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 * 选择集: 所有的操作都是基于选择集的
 */

TQ = TQ || {};
(function () {
    var SelectSet = {},
    // 需要多重选择的命令， 先开始，连续选择，再点1次，执行并结束
    // 需要连续选择的， 先开始， 然后选1个，执行1个，再点1次则结束
    // 需要单一选择的命令，先选择， 再执行。
    // 同时只能有1个命令在执行（不论是多选，连续选，还是单选） 互斥的操作， 避免同时嵌套使用
        state = {
            multiCmdStarted: false,
            cmd: null
        };

    SelectSet.SELECTION_NEW_EVENT = "selected new element";
    SelectSet.SELECTION_EMPTY_EVENT = "selection empty";
    SelectSet.members = [];
    SelectSet.decorations = [];  //  decorations ready to use
    SelectSet.workingDecorations = []; // decorations is using.
    SelectSet.selectedMarkers = []; // 选中的dec元素的集合(转轴点和夹点都是marker)(一个物体上只能选中一个)
    SelectSet.multiCmdGroupIt = multiCmdGroupIt;
    SelectSet.multiCmdJointIt = multiCmdJointIt;
    SelectSet.initialize = function() {
        TQ.InputMap.registerAction(TQ.InputMap.DELETE_KEY, function(){
            if ( (!TQ.TextEditor.visible) && (!TQ.FileDialog.visible)) {
                TQ.SelectSet.delete();
            }
        });
        TQ.InputMap.registerAction(TQ.InputMap.DELETE_KEY | TQ.InputMap.LEFT_ALT_FLAG, TQ.SelectSet.eraseAnimeTrack);
        TQ.InputMap.registerAction(TQ.InputMap.EMPTY_SELECTOR, TQ.SelectSet.clear);

        var keyActionPair = {
            1: "idle",
            2: "work",
            3: "run",
            4: "smile",
            5: "stand"
        };
        TQ.InputMap.registerAction(TQ.InputMap.D1, function() { SelectSet.playAnimation(keyActionPair[1]);});
        TQ.InputMap.registerAction(TQ.InputMap.D2, function() { SelectSet.playAnimation(keyActionPair[2]);});
        TQ.InputMap.registerAction(TQ.InputMap.D3, function() { SelectSet.playAnimation(keyActionPair[3]);});
        TQ.InputMap.registerAction(TQ.InputMap.D4, function() { SelectSet.playAnimation(keyActionPair[4]);});
        TQ.InputMap.registerAction(TQ.InputMap.D5, function() { SelectSet.playAnimation(keyActionPair[5]);});
    };

    SelectSet.playAnimation = function (actionName) {
        var ele = SelectSet.peek();
        if (ele != null) {
            ele.playAction(actionName);
        }
    };

    SelectSet.getDecoration = function () {
        var decs = SelectSet.decorations.pop();
        if (decs == null) {
            var ref = TQ.SelectSet.members[0];
            assertNotNull(TQ.Dictionary.PleaseSelectHost, ref);
            //ToDo: 生成所有的夹点, 和 轴心点 图案.
            var ele = TQ.Element.build(ref.level, {isVis: 0, type:"JointMarker"});
            decs = [ele];
        }
        SelectSet.workingDecorations.push(decs);
        return decs;
    };

    SelectSet.recycleDecoration = function(decoration) {
        var id = SelectSet.workingDecorations.indexOf(decoration);
        SelectSet.workingDecorations.splice(id, 1);
        SelectSet.decorations.push(decoration);
    };

    SelectSet.add = function(element) {
        assertNotNull(TQ.Dictionary.PleaseSelectOne, element);
        if ((element == null )) return;
        if (element.isMarker()) { //  Decoration 不能记入选择集
            SelectSet.selectedMarkers.push(element);
            return;
        }

        SelectSet.selectedMarkers.splice(0); // 换了物体， Decoration就可能不被选中了。
        if (!(TQ.InputMap.isPresseds[TQ.InputMap.LEFT_CTRL] || TQ.InputCtrl.vkeyCtrl)) {
            if (!((SelectSet.members.length == 1) && (SelectSet.members.indexOf(element) ==0))) {
                SelectSet.clear();
            }
        }
        if (SelectSet.members.indexOf(element) < 0) {
            SelectSet.members.push(element);
            element.highlight(true);
            if (TQ.InputCtrl.inSubobjectMode)  SelectSet.attachDecoration(element);

            // 对于关节物体上的子关节，在整体模式下，情况复杂一些：
            //    如果是“移动关节”： 则选中的是子关节
            //    如果是floatToolbar上的操作，缩放、旋转，等， 则是整体
            if (!TQ.InputCtrl.inSubobjectMode && element.isJoint()) {
                TQ.FloatToolbar.selectedElement = element;
            } else {
                TQ.FloatToolbar.selectedElement = element;
            }
        }

        TQ.Base.Utility.triggerEvent(document, SelectSet.SELECTION_NEW_EVENT, {element: element});
    };

    /*
    删除当前选中的所有元素
     */
    SelectSet.delete = function() {
        SelectSet.clear(true);
        TQ.DirtyFlag.setScene();
    };

    SelectSet.clear = function(withDelete) {
        var cmd;
        if (withDelete) {
            cmd = new TQ.CompositeCommand();
        }

        for (var i = 0; i< SelectSet.members.length; i++) {
            var ele = SelectSet.members[i];
            assertNotNull(TQ.Dictionary.FoundNull, ele);
            if (ele.isValid()) ele.highlight(false); // 可能已经被前面的父物体一起删除了
            SelectSet.detachDecoration(ele);
            if (withDelete && ele.isValid()) {
                cmd.addCommand(new TQ.DeleteEleCommand(currScene, ele));
            }
        }
        if (withDelete && (cmd.commands.length > 0)) {
            TQ.CommandMgr.directDo(cmd);
        }

        if (SelectSet.getElementUnderMouse() == null) {
            TQ.FloatToolbar.close();
            //ToDo:@UI
            // if (TQ.TabsMenu.closeDiv) {
            //    TQ.TabsMenu.closeDiv();
            // }
        }

        SelectSet.members.splice(0); // 删除全部选中的物体;
        SelectSet.selectedMarkers.splice(0);
    };

    SelectSet.updateDecorations = function(show) {
        for (var i = 0; i< SelectSet.members.length; i++) {
            var ele = SelectSet.members[i];
            if (show) {
                SelectSet.attachDecoration(ele);
            } else {
                SelectSet.detachDecoration(ele);
            }
        }
    };

    function groupIt() {
        var isUnGroup = TQ.InputMap.isPresseds[TQ.InputMap.LEFT_CTRL] || TQ.InputCtrl.vkeyUngroup;
        if (isUnGroup || (SelectSet.members.length >= 2)) {
            TQ.CommandMgr.directDo(new TQ.GroupCommand(SelectSet.members, isUnGroup));
            SelectSet.clear();
            return true;
        }

        return false;
    }

    function multiCmd(cmd) { // 先开始， 再结束， 必须配对、紧邻，
        if (state.multiCmdStarted) {
            if (state.cmd === cmd) {
                state.multiCmdStarted = false;
                clearSubjectModeAndMultiSelect();
                // return groupIt();
                return cmd();
            }
            return TQ.MessageBox.prompt("先结束当前操作！");
        }

        state.multiCmdStarted = true;
        state.cmd = cmd;
        SelectSet.clear();
        setSubjectModeAndMultiSelect();
    }

    function multiCmdGroupIt() {
        return multiCmd(groupIt);
    }

    function multiCmdJointIt() {
        return multiCmd(jointIt);
    }

    function setSubjectModeAndMultiSelect() {
        /*        if (!TQ.InputCtrl.inSubobjectMode) { // 设置 零件模式
         if (!Menu.JointStarted) {  //加关节操作中， 必须是 真的 零件模式， 不能只是 showMarker
         // TQ.InputCtrl.showMarkerOnly = true;
         }
         if (Menu.JointStarted) { // 只有加关节才进入零件模式， 以便于修改各个关节的转轴点。
         $("#subElementMode").click();
         }
         }
         */
        TQ.InputCtrl.vkeyCtrl = true; // 设置多选
    }

    function clearSubjectModeAndMultiSelect() {
        TQ.InputCtrl.showMarkerOnly = false;
        /*        if (TQ.InputCtrl.inSubobjectMode) {
         $("#subElementMode").click();
         }

         if (Menu.tb3Dfy) {
         $("#tb3Dfy").click();
         }

         */
        TQ.InputCtrl.vkeyCtrl = false;  // 取消多选
    }

    function jointIt() {
        var hasUnjointFlag = TQ.InputMap.isPresseds[TQ.InputMap.LEFT_CTRL] || TQ.InputCtrl.vkeyUnjoint;
        TQ.CommandMgr.directDo(new TQ.JointCommand(SelectSet.members, hasUnjointFlag));
        SelectSet.clear();
    }

    SelectSet.pinIt = function() {
        for (var i = 0; i< SelectSet.members.length; i++) {
            var ele = SelectSet.members[i];
            assertNotNull(TQ.Dictionary.FoundNull, ele);
            if (ele.isValid()) ele.pinIt();
        }
    };

    SelectSet.show = function(visible) {
        var allowIndividual = TQ.InputCtrl.inSubobjectMode || TQ.InputMap.isPresseds[TQ.InputMap.LEFT_ALT];
        TQ.CommandMgr.directDo(new TQ.HideCommand(SelectSet.members, allowIndividual));
    };

    SelectSet.doShow = function(eles, allowIndividual) {
        var isVisible = false,
            target = null;

        for (var i=0; i< eles.length; i++) {
            var ele = eles[i];
            if (!allowIndividual) {
                while (ele.isJoint() && (ele.parent != null)) { // find root for joints
                    ele = ele.parent;
                }
            }
            isVisible = ele.isVisible();
            ele.toggleVisibility();
            target = ele;
        }

        if (target && isVisible) {
            TQ.FloatToolbar.show(target.getType());
        } else {
            TQ.FloatToolbar.close();
        }
    };

    SelectSet.eraseAnimeTrack = function() {
        TQ.FrameCounter.gotoBeginning();
        for (var i = 0; i< SelectSet.members.length; i++) {
            var ele = SelectSet.members[i];
            assertNotNull(TQ.Dictionary.FoundNull, ele);
            if (ele.isValid()) ele.eraseAnimeTrack();
        }
    };

    SelectSet.getElementUnderMouse = function() {
        TQ.Assert.isTrue(!!stage, "没有初始化stage！");
        var target = stage.selectedItem;
        var element = (target == null)? null: currScene.findAtom(target);  //包括点击菜单, 此函数也会响应
        if (element != null) {
            element = SelectSet.getEditableEle(element);
        }

        return element;
    };

    SelectSet.getSelectedElement = function() {
        var element = SelectSet.getElementUnderMouse();
        if (element != null) {
            SelectSet.add(element);
        } else {
            if (!TQ.InputMap.isPresseds[TQ.InputMap.LEFT_CTRL]) {
                SelectSet.clear();
            }
            TQ.FloatToolbar.close();
        }

        return TQ.SelectSet.peek();
    };

    SelectSet.getEditableEle = function(ele) {  // 获取Group物体在整体操作模式下的可操作对象
        // Jointed 物体： 获取当前的joint
        // Group的物体: 而且没有打散, 则操作其根
        // 3D打包的物体：操作其根
        if (TQ.InputCtrl.showMarkerOnly) { // 在创作复合物体的时候， 如果不在零件模式，也可以只要求显示Marker。
            assertTrue(TQ.Dictionary.INVALID_LOGIC, TQ.InputCtrl.inSubobjectMode);
        }

        if ((!ele.isJoint()) && ele.isGrouped()) {
            if ((!TQ.InputCtrl.inSubobjectMode) || TQ.InputCtrl.showMarkerOnly) {
                if (ele.parent != null) return TQ.SelectSet.getEditableEle(ele.parent);
            }
        }
        return ele;
    };

    SelectSet.isSelected = function(ele) {
        return ((SelectSet.members.indexOf(ele) >= 0) ||
            (SelectSet.selectedMarkers.indexOf(ele) >= 0));
    };

    SelectSet.empty = function() {
        if (SelectSet.members.length > 0) {
            SelectSet.clear();
            TQ.DirtyFlag.setScene();
            TQ.Base.Utility.triggerEvent(document, SelectSet.SELECTION_EMPTY_EVENT, {element: null});
        }
        TQ.AssertExt.invalidLogic(SelectSet.selectedMarkers.length === 0);
    };

    SelectSet.isEmpty = function() {
        return (SelectSet.members.length === 0);
    };

    SelectSet.isInMultiCmd = function () {
        return state.multiCmdStarted;
    };

    /*
    返回第一个元素，并且，从选择集中删除它
     */
    SelectSet.pop = function() {
        assertTrue(TQ.Dictionary.INVALID_PARAMETER, SelectSet.members.length > 0); //非空集合
        var ele = SelectSet.members.pop();
        SelectSet.detachDecoration(ele);
        return (ele);
    };

    /*
     返回 第一个选中的元素， 但是，仍然保留它在选择集中， 不删除
     */
    SelectSet.peek = function() {
        if (SelectSet.members.length <= 0) {
            return null;
        }
        return (SelectSet.members[0]);
    };

    SelectSet.detachDecoration = function(ele) {
        if (ele.decorations != null) {
            var decoration = ele.detachDecoration();
            SelectSet.recycleDecoration(decoration);
        }
    };

    SelectSet.attachDecoration = function(ele){
        if (!ele.decorations) {
            ele.attachDecoration(SelectSet.getDecoration());
        }
    };

    // 命令：
    function GroupCommand(elements, hasUngroupFlag) {
        this.receiver = [];
        for (var i = 0; i < elements.length; i++) { //需要复制元素， 防止原来的集合被clear清空
            this.receiver.push(elements[i]);
        }
        this.oldValue = !hasUngroupFlag;
        this.newValue = hasUngroupFlag;
    }

    inherit(GroupCommand, TQ.AbstractCommand);

    GroupCommand.prototype.do = function() {
        currScene.groupIt(this.receiver, this.newValue);
        return(this.constructor.name + this.receiver);
    };

    GroupCommand.prototype.undo = function() {
        if (this.oldValue) {  // ungroup 需要这些元素的根（Group元素）， 而不需要这些元素本身
            assertTrue(TQ.Dictionary.INVALID_PARAMETER, this.receiver.length > 0);
            currScene.groupIt([this.receiver[0].parent], this.oldValue);
        }
        return(this.constructor.name + this.receiver);
    };

    GroupCommand.prototype.redo = GroupCommand.prototype.do;

    function JointCommand(elements, hasUnjointFlag) {
        this.receiver = [];
        for (var i = 0; i < elements.length; i++) {
            this.receiver.push(elements[i]);
        }
        this.oldValue = !hasUnjointFlag;
        this.newValue = hasUnjointFlag;
    }

    inherit(JointCommand, TQ.AbstractCommand);

    JointCommand.prototype.do = function() {
        currScene.joint(this.receiver, this.newValue);
        return(this.constructor.name + this.receiver);
    };

    JointCommand.prototype.undo = function() {
        currScene.joint(this.receiver, this.oldValue);
        return(this.constructor.name + this.receiver);
    };

    JointCommand.prototype.redo = JointCommand.prototype.do;

    // 命令：
    function HideCommand(elements, allowIndividual) {
        this.receiver = [];
        for (var i = 0; i < elements.length; i++) { //需要复制元素， 防止原来的集合被clear清空
            this.receiver.push(elements[i]);
        }
        this.oldValue = allowIndividual;
        this.newValue = allowIndividual;
    }

    inherit(HideCommand, TQ.AbstractCommand);

    HideCommand.prototype.do = function() {
        SelectSet.doShow(this.receiver, this.newValue);
        return(this.constructor.name + this.receiver);
    };

    HideCommand.prototype.undo = function() {
        SelectSet.doShow(this.receiver, this.oldValue);
        return(this.constructor.name + this.receiver);
    };

    HideCommand.prototype.redo = HideCommand.prototype.do;

    TQ.GroupCommand = GroupCommand;
    TQ.JointCommand = JointCommand;
    TQ.HideCommand = HideCommand;
    TQ.SelectSet = SelectSet;
}());
