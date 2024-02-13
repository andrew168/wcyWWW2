/**
 * Tuqiang Game Engine
 * Copyright Tuqiang Tech
 * 创建了 一个 静态的 常量，类， State， 用于记录 Level的状态。
 * Created at : 12-11-14 下午4:06
 */

window.TQBase = window.TQBase || {};

(function() {
  function LevelState() {
  }

  LevelState.NOT_INIT = 0;
  LevelState.ISLOADING = 1; // 只是load，不能立即加入Stage
  LevelState.LOADED = 2;
  LevelState.INITING = 3;
  LevelState.RUNNING = 4;
  LevelState.EDITING = 5;
  LevelState.EXIT = 6;
  LevelState.SHOOTING = 16;
  LevelState.PLAYING = 17;
  LevelState.PAUSE = 18;

  LevelState.OP_NO = 0;
  LevelState.OP_TIMER_UI = 0x101;
  LevelState.OP_TOOLBAR = 0x103;
  LevelState.OP_TABS = 0x107;
  LevelState.OP_CANVAS = 0x10F; //  具体的操作, 及其元素, 见Element
  LevelState.OP_FLOATTOOLBAR = 0x11F;
  LevelState.operation = LevelState.OP_NO;
  LevelState.saveOperation = function(op) { LevelState.operation = op; };
  LevelState.isOperatingCanvas = function() { return (LevelState.operation === LevelState.OP_CANVAS); };
  LevelState.isOperatingTimerUI = function() { return (LevelState.operation === LevelState.OP_TIMER_UI); };
  LevelState.reset = function() {
    LevelState.operation = 0;
  };

  TQBase.LevelState = LevelState;
}());
