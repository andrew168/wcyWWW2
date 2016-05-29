/*
   浮动工具条
   */
window.TQ = window.TQ || {};

(function () {
    /// 以下是接口部分
    var FloatToolbar = {};
    var _initialized = false,
        _barEle,
        _isVisible;

    /*
       初始化工具条
       */
    FloatToolbar.initialize = function() {
        if (_initialized) {
            return;
        }

        _initialized = true;
        TQ.FloatToolbar.selectedElement = null;
        _barEle = TQ.DomUtil.getElementById('floatToolbarDiv');
        _setupButtons();
        FloatToolbar.close();
    };

    /*
       显示（true）和隐藏（false）此工具条：
       */
    FloatToolbar.show = function(eleType) {
        if (!_initialized) {
            return;
        }

        if (_barEle) {
            TQ.DomUtil.show(_barEle);
            _isVisible = true;
        }
    };

    FloatToolbar.close = function() {
        if (!_initialized) {
            return;
        }

        if (_barEle) {
            TQ.DomUtil.close(_barEle);
            _isVisible = false;
        }
    };

    /*
       在位置（x,y) 显示工具条
       */
    FloatToolbar.setPosition = function(x,y) {
        // _barEle.css('left', x - 100).css('top',y + 30);
    };

    /*
       获取工具条的可见性
       */
    FloatToolbar.isVisible = function()
    {
        return _isVisible;
    };

    /// 以下是内部代码
    function _setupButtons() {
        //放大
        $('#doScaleBig').bind('touchstart click', function(evt){
            evt.stopPropagation();
            evt.preventDefault();
            TQBase.LevelState.saveOperation(TQBase.LevelState.OP_FLOATTOOLBAR);
            TQ.InputCtrl.doScale(TQ.FloatToolbar.selectedElement, 1.2);
        });
        //缩小
        $('#doScaleSmall').bind('touchstart click', function(evt){
            evt.stopPropagation();
            evt.preventDefault();
            TQBase.LevelState.saveOperation(TQBase.LevelState.OP_FLOATTOOLBAR);
            TQ.InputCtrl.doScale(TQ.FloatToolbar.selectedElement, 0.8);
        });
        //左旋转
        $('#rotateLeft').bind('touchstart click', function(evt){
            evt.stopPropagation();
            evt.preventDefault();
            TQBase.LevelState.saveOperation(TQBase.LevelState.OP_FLOATTOOLBAR);
            TQ.IKCtrl.rotate(TQ.FloatToolbar.selectedElement, 10);
        });
        //右旋转
        $('#rotateRight').bind('touchstart click', function(evt){
            evt.stopPropagation();
            evt.preventDefault();
            TQBase.LevelState.saveOperation(TQBase.LevelState.OP_FLOATTOOLBAR);
            TQ.IKCtrl.rotate(TQ.FloatToolbar.selectedElement, -10);
        });
        //移动到上一层
        $('#moveLayerPrev').bind('touchstart click', function(evt){
            evt.stopPropagation();
            evt.preventDefault();
            TQBase.LevelState.saveOperation(TQBase.LevelState.OP_FLOATTOOLBAR);
            TQ.MoveCtrl.moveLayer(TQ.FloatToolbar.selectedElement, 1);
        });
        //移动到下一层
        $('#moveLayerNext').bind('touchstart click', function(evt){
            evt.stopPropagation();
            evt.preventDefault();
            TQBase.LevelState.saveOperation(TQBase.LevelState.OP_FLOATTOOLBAR);
            TQ.MoveCtrl.moveLayer(TQ.FloatToolbar.selectedElement, -1);
        });
        //移动到最顶
        $('#moveToTop').bind('touchstart click', function(evt){
            evt.stopPropagation();
            evt.preventDefault();
            TQBase.LevelState.saveOperation(TQBase.LevelState.OP_FLOATTOOLBAR);
            TQ.MoveCtrl.moveToTop(TQ.FloatToolbar.selectedElement);
        });
        //移动到低
        $('#moveToBottom').bind('touchstart click', function(evt){
            evt.stopPropagation();
            evt.preventDefault();
            TQBase.LevelState.saveOperation(TQBase.LevelState.OP_FLOATTOOLBAR);
            TQ.MoveCtrl.moveToBottom(TQ.FloatToolbar.selectedElement);
        });
        //删除
        $('#delete').bind('touchstart click', function(evt){
            evt.stopPropagation();
            evt.preventDefault();
            TQBase.LevelState.saveOperation(TQBase.LevelState.OP_FLOATTOOLBAR);
            TQ.SelectSet.delete();
            TQ.FloatToolbar.close();
        });
        //镜像变换: 关于X轴镜像，（上下对称）
        $('#mirrorX').bind('touchstart click', function(evt){
            evt.stopPropagation();
            evt.preventDefault();
            TQBase.LevelState.saveOperation(TQBase.LevelState.OP_FLOATTOOLBAR);
            TQ.InputCtrl.mirrorX(TQ.FloatToolbar.selectedElement);
        });
        //镜像变换: 关于Y轴镜像，（左右对称）
        $('#mirrorY').bind('touchstart click', function(evt){
            evt.stopPropagation();
            evt.preventDefault();
            TQBase.LevelState.saveOperation(TQBase.LevelState.OP_FLOATTOOLBAR);
            TQ.InputCtrl.mirrorY(TQ.FloatToolbar.selectedElement);
        });
    }

    TQ.FloatToolbar = FloatToolbar;
}());
