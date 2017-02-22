var value = 0;

function initWorkingArea() {
    allowDroppable();
    $('div#tab_right_panel img').draggable({helper: 'clone'}); // .rotate(30);
}

function allowDroppable()
{
    var options = {
        // activeClass: "ui-state-hover",   // 只用于调试，
        // hoverClass: "ui-state-active"    // 只用于调试，
    };

    options.drop = function(event,info){
        displayInfo2("x=" + info.offset.left +  "y= " + info.offset.top);
        var res = $(info.draggable);
        var target = stage.getObjectsUnderPointer2(event); // 选中物体
        var x0 = screenToRegionX(pivotToCenterX(info.offset.left));
        var y0 = screenToRegionY(pivotToCenterY(info.offset.top));
        var z0 = TQ.Utility.getMaxZ() + 1;
        _addResToStage(res, target, x0, y0, z0);
    };

    $('#workingarea').droppable(options);
}

function _addResToStage(res, target, x0, y0, z0, levelID, _t0)
{
    if (res == null) {
        return;
    }

    if (_t0 == undefined) {
        _t0 = TQ.FrameCounter.t();
    }
    var imageSrc = res.attr('src');
    var resType = res.attr('type');
    var eleType = res.attr('eType');
    var resAlias = res.attr('title');

    if ((!imageSrc) || (!resType) ||(!eleType)) {
        assertTrue(TQ.Dictionary.INVALID_PARAMETER + "src, tyep or eType", imageSrc && resType && eleType);
        return;
    }

    var RES_TYPE_WCY = "1",
        RES_TYPE_PICTURE = "2",
        RES_TYPE_COMPONENT = "3",
        RES_TYPE_BUTTON = "4",
        RES_TYPE_AUDIO = "11";

    var ELE_TYPE_BACKGROUND = "1",
        ELE_TYPE_PROP = "2",
        ELE_TYPE_CHARACTER = "3",
        ELE_TYPE_TEXT = "4",
        ELE_TYPE_EFFECT = "5",
        ELE_TYPE_BUTTON = "6",
        ELE_TYPE_AUDIO = "7";

    if (eleType != undefined) {
        if (eleType == ELE_TYPE_BUTTON) {
            resType = RES_TYPE_BUTTON;
        }
    }

    var type = null, resName = null;

    //ToDo：去除src开头的"/."
    imageSrc = imageSrc.replace("/.", "");

    if ( !((imageSrc == undefined) || (imageSrc == null)) ) {  // 阻止非Image的 HTML元素
        if (resType == RES_TYPE_WCY) {
            return openScene(TQ.Utility.getSceneByThumbnail(imageSrc));
        } else {
            switch (resType) {
                case RES_TYPE_AUDIO:
                    type = "SOUND";
                    var soundSrc = res.attr('soundsrc'); //与属性名称的大小写无关，因为浏览器把元素的属性名称全转为小写。
                    resName = TQ.Utility.getAudioByThumbnail(soundSrc);
                    if (!target) {
                        displayInfo2("请把声音拖放到合适的物体上！");
                    } else {
                        TQ.SelectSet.getSelectedElement();
                        displayInfo2(target.toString());
                    }
                    break;

                case RES_TYPE_COMPONENT:
                    type = "GroupFile";
                    x0 = 0;
                    y0 = TQ.Config.workingRegionHeight;
                    //元件的插入点， 改为屏幕的左下角，以保持元件保存时的屏幕位置。
                    resName = TQ.Utility.getComponentByThumbnail(imageSrc);
                    // resName = "/mcAssets/" + resName + ".wdm";
                    break;

                case RES_TYPE_BUTTON:
                    type = "BUTTON";
                    resName = TQ.Utility.getImageByThumbnail(imageSrc);
                    break;

                case RES_TYPE_PICTURE:
                default:
                    if (resType != RES_TYPE_PICTURE) {
                        assertTrue(TQ.Dictionary.INVALID_PARAMETER, 0);  // 非法， 当做图片处理
                    }
                    type = "Bitmap";
                    resName = TQ.Utility.getImageByThumbnail(imageSrc);
                    break;
            }

            //所有的资源，包括声音，都是通过此处加入到舞台中的，并且加上时间标记
            var desc = {src:resName, alias:resAlias, type:type, eType: eleType, x: x0, y:TQ.Utility.toWorldCoord(y0), zIndex: z0, t0:_t0};
            if (levelID != undefined) { // 支持跨场景的元素插入
                desc.levelID = levelID;
            }

            return addImage(desc);
        }
    }
}

/*
 添加资源到舞台的正中央, res是资源区的一个资源，采用JQuery形式表示。
 */
function addResToStageCenter(res, levelID, t0) {
    var target = TQ.SelectSet.peek(); // 选中物体
    var x0 = currScene.getDesignatedWidth()/ 2;
    var y0 = currScene.getDesignatedHeight() / 2;
    var z0 = TQ.Utility.getMaxZ() + 1;
    return _addResToStage(res, target, x0, y0, z0, levelID, t0);
}

// 界面布局变了 (去除了顶部的文字菜单区),所以 从屏幕坐标到绘图区坐标的变换也要变
function screenToRegionX(screenX)
{
    return (screenX - TQ.Config.workingRegionX0);
}

function screenToRegionY(screenY)
{
    return (screenY - TQ.Config.workingRegionY0);
}

function pivotToCenterX(regionX) {
    return (regionX + TQ.Config.THUMBNAIL_WIDTH/2);
}

function pivotToCenterY(regionY) {
    return (regionY + TQ.Config.THUMBNAIL_HEIGHT/2);
}
