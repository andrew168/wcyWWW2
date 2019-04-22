/**
 * Created by Andrewz on 4/19/19.
 */
var TQ = TQ || {};
TQ.Interact = (function () {
  var interactOps = [
      ['touch', onClick]
   ],
    startEle = null;

  return {
    start: start,
    close: close
  };

  function start() {
    TQ.State.editorMode = TQ.SceneEditor.MODE.INTERACT;
    if (!TQUtility.isMobile()) {// mobile不需要mousedown
      interactOps['mousedown'] = onClick;
    }
    TQ.TouchManager.save();
    TQ.TouchManager.attachOps(interactOps);
  }

  function close() {
    TQ.State.editorMode = TQ.SceneEditor.MODE.PREVIEW;
    TQ.TouchManager.restore();
  }

  function onClick(e) { // ==mouse的onPressed，
    TQ.Log.debugInfo("touch start or mousedown" + TQ.Utility.getTouchNumbers(e));
    updateStartElement(e);
    e.stopPropagation();
    e.preventDefault();
    if (startEle) {
      startEle.playNextSound();
    }
  }

  function updateStartElement(e) {
    TQ.AssertExt.invalidLogic(!!e);
    if (!e) {
      return null;
    }

    TQ.SelectSet.updateByGesture(e);
    startEle = TQ.SelectSet.peekLatestEditableEle();
    if (!startEle) {
      startEle = null;
      TQ.SelectSet.empty();
      TQ.FloatToolbar.close();
      return null;
    }

    return startEle;
  }
}());
