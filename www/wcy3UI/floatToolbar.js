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
  FloatToolbar.onMoveUpLayer = depreciated;
  FloatToolbar.onMoveDownLayer = depreciated;
  FloatToolbar.onMoveToTop = depreciated;
  FloatToolbar.onMoveToBottom = depreciated;
  FloatToolbar.onDelete = depreciated;
  FloatToolbar.onMirrorX = depreciated;
  FloatToolbar.onMirrorY = depreciated;

  //
  FloatToolbar.initialize = depreciated;
  FloatToolbar.close = depreciated;
  FloatToolbar.show = depreciated;
  FloatToolbar.setPosition = depreciated;
  FloatToolbar.close = depreciated;

  function depreciated() {
    TQ.Log.depreciated();
  }

  TQ.FloatToolbar = FloatToolbar;
}());
