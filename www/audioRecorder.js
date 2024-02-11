/**
 * Created by Andrewz on 8/18/18.
 */
var TQ = TQ || {};
TQ.AudioRecorder = (function() {
  var CLOSE_MIC_WHEN_PENDING = true;
  var STATE_UNKNOWN = 0;
  var STATE_INITIALIZED = 1;
  var STATE_STARTED = 2;
  var STATE_PENDING = 3;
  var recorder;
  var state = STATE_UNKNOWN;
  var onStopCallback;

  return {
    get isPending() {
      return state === STATE_PENDING;
    },
    get isRecording() {
      return state === STATE_STARTED;
    },
    accept: accept,
    close: close,
    start: start,
    stop: stop
  };

  function init(onSuccess, onError) {
    recorder = new Recorder({
      sampleRate: 44100, // 采样频率，默认为44100Hz(标准MP3采样率)
      bitRate: 128, // 比特率，默认为128kbps(标准MP3质量)
      success: function() { // //成功回调函数
        state = STATE_INITIALIZED;
        console.log("录音设备初始化成功!");
        if (onSuccess) {
          onSuccess();
        }
      },

      error: function(msg) { // 失败回调函数
        alert(msg);
        if (onError) {
          onError();
        }
      },
      fix: function(msg) { // 不支持H5录音回调函数
        alert(msg);
        if (onError) {
          onError();
        }
      }
    });
  }

  function start(callback, refreshUI) {
    if (state >= STATE_INITIALIZED && state !== STATE_PENDING) {
      if (state === STATE_STARTED) { // 不能重复开始，但是，如果有pending的， 则忽略它
        return;
      }
      state = STATE_STARTED;
      onStopCallback = callback;
      recorder && recorder.start();
      if (refreshUI) {
        refreshUI();
      }
    } else {
      init(function() {
        start(callback, refreshUI);
      });
    }
  }

  function stop() {
    if (state < STATE_STARTED) {
      return setTimeout(function() {
        stop();
      });
    }

    state = STATE_PENDING;
    if (!onStopCallback) {
      onStopCallback = defaultCallback;
    }

    recorder && recorder.stop();
    recorder && recorder.getBlob(function(data) {
      onStopCallback(data);
      onStopCallback = null;
      setTimeout(function() {
        recorder.close();
      });
    });
  }

  function accept() {
    if (state === STATE_STARTED) {
      stop();
    }
    // recorder.close();
    state = STATE_UNKNOWN;
  }

  function defaultCallback(blob) {
    console.log("sound recorded: type = " + blob.type + ", size = " + blob.size);
    var audio = document.createElement("audio");
    audio.src = URL.createObjectURL(blob);
    audio.controls = true;
    document.appendChild(audio);
  }
})();
