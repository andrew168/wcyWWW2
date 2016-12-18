/*
   浮动工具条
   */
window.TQ = window.TQ || {};

(function () {
    /// 以下是接口部分
    function FloatToolbar() {}
    FloatToolbar.selectedElement = null;
    FloatToolbar.onScaleBig = depreciated;
    FloatToolbar.onScaleSmall = depreciated;
    FloatToolbar.onRotateLeft = depreciated;
    FloatToolbar.onRotateRight = depreciated;
    FloatToolbar.onMoveUpLayer = onMoveUpLayer;
    FloatToolbar.onMoveDownLayer = onMoveDownLayer;
    FloatToolbar.onMoveToTop = onMoveToTop;
    FloatToolbar.onMoveToBottom = onMoveToBottom;
    FloatToolbar.onDelete = depreciated;
    FloatToolbar.onMirrorX = onMirrorX;
    FloatToolbar.onMirrorY = onMirrorY;

    //
    FloatToolbar.initialize = depreciated;
    FloatToolbar.close = depreciated;
    FloatToolbar.show = depreciated;
    FloatToolbar.setPosition = depreciated;
    FloatToolbar.close = depreciated;


    function onScaleBig(evt)
    {
        evt.stopPropagation();
        evt.preventDefault();
        TQBase.LevelState.saveOperation(TQBase.LevelState.OP_FLOATTOOLBAR);
        TQ.InputCtrl.doScale(TQ.FloatToolbar.selectedElement, 1.2);
    }


    function onScaleSmall(evt) {
        evt.stopPropagation();
        evt.preventDefault();
        TQBase.LevelState.saveOperation(TQBase.LevelState.OP_FLOATTOOLBAR);
        TQ.InputCtrl.doScale(TQ.FloatToolbar.selectedElement, 0.8);
    }

    function onRotateLeft(evt) {
        evt.stopPropagation();
        evt.preventDefault();
        TQBase.LevelState.saveOperation(TQBase.LevelState.OP_FLOATTOOLBAR);
        TQ.IKCtrl.rotate(TQ.FloatToolbar.selectedElement, 10);
    }

    function onRotateRight(evt) {
        evt.stopPropagation();
        evt.preventDefault();
        TQBase.LevelState.saveOperation(TQBase.LevelState.OP_FLOATTOOLBAR);
        TQ.IKCtrl.rotate(TQ.FloatToolbar.selectedElement, -10);
    }

    function onMoveUpLayer(evt) {
        evt.stopPropagation();
        evt.preventDefault();
        TQBase.LevelState.saveOperation(TQBase.LevelState.OP_FLOATTOOLBAR);
        TQ.MoveCtrl.moveLayer(TQ.FloatToolbar.selectedElement, 1);
    }

    function onMoveDownLayer(evt) {
        evt.stopPropagation();
        evt.preventDefault();
        TQBase.LevelState.saveOperation(TQBase.LevelState.OP_FLOATTOOLBAR);
        TQ.MoveCtrl.moveLayer(TQ.FloatToolbar.selectedElement, -1);
    }

    function onMoveToTop(evt) {
        evt.stopPropagation();
        evt.preventDefault();
        TQBase.LevelState.saveOperation(TQBase.LevelState.OP_FLOATTOOLBAR);
        TQ.MoveCtrl.moveToTop(TQ.FloatToolbar.selectedElement);
    }

    function onMoveToBottom(evt) {
        evt.stopPropagation();
        evt.preventDefault();
        TQBase.LevelState.saveOperation(TQBase.LevelState.OP_FLOATTOOLBAR);
        TQ.MoveCtrl.moveToBottom(TQ.FloatToolbar.selectedElement);
    }

    function onDelete(evt) {
        evt.stopPropagation();
        evt.preventDefault();
        TQBase.LevelState.saveOperation(TQBase.LevelState.OP_FLOATTOOLBAR);
        TQ.SelectSet.delete();
        TQ.FloatToolbar.close();
    }

    function onMirrorX(evt) {
        evt.stopPropagation();
        evt.preventDefault();
        TQBase.LevelState.saveOperation(TQBase.LevelState.OP_FLOATTOOLBAR);
        TQ.InputCtrl.mirrorX(TQ.FloatToolbar.selectedElement);
    }

    function onMirrorY(evt) {
        evt.stopPropagation();
        evt.preventDefault();
        TQBase.LevelState.saveOperation(TQBase.LevelState.OP_FLOATTOOLBAR);
        TQ.InputCtrl.mirrorY(TQ.FloatToolbar.selectedElement);
    }

    function depreciated() {
        TQ.Log.depreciated();
    }

    TQ.FloatToolbar = FloatToolbar;
}());
