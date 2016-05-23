/*
   浮动工具条
   */
window.TQ = window.TQ || {};

(function () {
    /// 以下是接口部分
    var floatToolbar = {};

    floatToolbar.obj=function(){
        return $('#floatToolbarDiv');
    };
    /*
       初始化工具条
       */
    floatToolbar.initialize = function() {
        TQ.floatToolbar.selectedElement = null;  
        floatToolbar.obj().css('display','none');
        floatToolbar.setupButtons();
    };

    /*
       显示（true）和隐藏（false）此工具条：
       */
    floatToolbar.show = function(flag) {
        var display_str='none';
        if(flag==true){
            display_str='block';
        }
        floatToolbar.obj().css('display',display_str);
    };

    /*
       在位置（x,y) 显示工具条
       */
    floatToolbar.setPosition = function(x,y) {
        floatToolbar.obj().css('left', x - 100).css('top',y + 30);
    };

    /*
       获取工具条的可见性
       */
    floatToolbar.isVisible = function()
    {
        status=floatToolbar.obj().css('display');
        if(status=='block'){
            return true;
        }else{
            return false;
        }
        //return false; // true: 可见， false: 不可见;
    };

    /// 以下是内部代码
    floatToolbar.setupButtons = function() {
        //放大
        $('#doScaleBig').bind('touchstart click', function(evt){
            evt.stopPropagation();
            evt.preventDefault();
            TQBase.LevelState.saveOperation(TQBase.LevelState.OP_FLOATTOOLBAR);
            TQ.InputCtrl.doScale(TQ.floatToolbar.selectedElement, 1.2);
        });
        //缩小
        $('#doScaleSmall').bind('touchstart click', function(evt){
            evt.stopPropagation();
            evt.preventDefault();
            TQBase.LevelState.saveOperation(TQBase.LevelState.OP_FLOATTOOLBAR);
            TQ.InputCtrl.doScale(TQ.floatToolbar.selectedElement, 0.8);
        });
        //左旋转
        $('#rotateLeft').bind('touchstart click', function(evt){
            evt.stopPropagation();
            evt.preventDefault();
            TQBase.LevelState.saveOperation(TQBase.LevelState.OP_FLOATTOOLBAR);
            TQ.IKCtrl.rotate(TQ.floatToolbar.selectedElement, 10);
        });
        //右旋转
        $('#rotateRight').bind('touchstart click', function(evt){
            evt.stopPropagation();
            evt.preventDefault();
            TQBase.LevelState.saveOperation(TQBase.LevelState.OP_FLOATTOOLBAR);
            TQ.IKCtrl.rotate(TQ.floatToolbar.selectedElement, -10);
        });
        //移动到上一层
        $('#moveLayerPrev').bind('touchstart click', function(evt){
            evt.stopPropagation();
            evt.preventDefault();
            TQBase.LevelState.saveOperation(TQBase.LevelState.OP_FLOATTOOLBAR);
            TQ.MoveCtrl.moveLayer(TQ.floatToolbar.selectedElement, 1);
        });
        //移动到下一层
        $('#moveLayerNext').bind('touchstart click', function(evt){
            evt.stopPropagation();
            evt.preventDefault();
            TQBase.LevelState.saveOperation(TQBase.LevelState.OP_FLOATTOOLBAR);
            TQ.MoveCtrl.moveLayer(TQ.floatToolbar.selectedElement, -1);
        });
        //移动到最顶
        $('#moveToTop').bind('touchstart click', function(evt){
            evt.stopPropagation();
            evt.preventDefault();
            TQBase.LevelState.saveOperation(TQBase.LevelState.OP_FLOATTOOLBAR);
            TQ.MoveCtrl.moveToTop(TQ.floatToolbar.selectedElement);
        });
        //移动到低
        $('#moveToBottom').bind('touchstart click', function(evt){
            evt.stopPropagation();
            evt.preventDefault();
            TQBase.LevelState.saveOperation(TQBase.LevelState.OP_FLOATTOOLBAR);
            TQ.MoveCtrl.moveToBottom(TQ.floatToolbar.selectedElement);
        });
        //删除
        $('#delete').bind('touchstart click', function(evt){
            evt.stopPropagation();
            evt.preventDefault();
            TQBase.LevelState.saveOperation(TQBase.LevelState.OP_FLOATTOOLBAR);
            TQ.SelectSet.delete();
            TQ.floatToolbar.show(false);
        });
        //镜像变换: 关于X轴镜像，（上下对称）
        $('#mirrorX').bind('touchstart click', function(evt){
            evt.stopPropagation();
            evt.preventDefault();
            TQBase.LevelState.saveOperation(TQBase.LevelState.OP_FLOATTOOLBAR);
            TQ.InputCtrl.mirrorX(TQ.floatToolbar.selectedElement);
        });
        //镜像变换: 关于Y轴镜像，（左右对称）
        $('#mirrorY').bind('touchstart click', function(evt){
            evt.stopPropagation();
            evt.preventDefault();
            TQBase.LevelState.saveOperation(TQBase.LevelState.OP_FLOATTOOLBAR);
            TQ.InputCtrl.mirrorY(TQ.floatToolbar.selectedElement);
        });
    };

    TQ.floatToolbar = floatToolbar;
}());
