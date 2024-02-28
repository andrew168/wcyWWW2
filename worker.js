(function() {
  "use strict";

  importScripts("lame.min.js");

  var mp3Encoder; var maxSamples = 1152; var samplesMono; var lame; var config; var dataBuffer;
  var stopped = false;

  var clearBuffer = function() {
    dataBuffer = [];
  };

  function reset() {
    if (mp3Encoder) {
      mp3Encoder.flush();
    }
    clearBuffer();
  }

  var appendToBuffer = function(mp3Buf) {
    if (stopped) {
      return;
    }
    dataBuffer.push(new Int8Array(mp3Buf));
  };

  var init = function(prefConfig) {
    config = prefConfig || {};
    lame = new lamejs();
    mp3Encoder = new lame.Mp3Encoder(1, config.sampleRate || 44100, config.bitRate || 128);
    clearBuffer();
    self.postMessage({
      cmd: "init"
    });
  };

  var floatTo16BitPCM = function(input, output) {
    for (var i = 0; i < input.length; i++) {
      var s = Math.max(-1, Math.min(1, input[i]));
      output[i] = (s < 0 ? s * 0x8000 : s * 0x7FFF);
    }
  };

  var convertBuffer = function(arrayBuffer) {
    var data = new Float32Array(arrayBuffer);
    var out = new Int16Array(arrayBuffer.length);
    floatTo16BitPCM(data, out);
    return out;
  };

  var encode = function(arrayBuffer) {
    if (stopped) {
      return;
    }
    samplesMono = convertBuffer(arrayBuffer);
    var remaining = samplesMono.length;
    for (var i = 0; remaining >= 0; i += maxSamples) {
      var left = samplesMono.subarray(i, i + maxSamples);
      var mp3buf = mp3Encoder.encodeBuffer(left);
      appendToBuffer(mp3buf);
      remaining -= maxSamples;
    }
  };

  var finish = function() {
    appendToBuffer(mp3Encoder.flush());
    self.postMessage({
      cmd: "end",
      buf: dataBuffer
    });
    clearBuffer();
  };

  self.onmessage = function(e) {
    switch (e.data.cmd) {
      case "init":
        init(e.data.config);
        break;
      case "start":
        reset();
        stopped = false;
        break;
      case "stop":
        stopped = true;
        break;
      case "encode":
        if (stopped) {
          console.error("用法错误：应该先start！");
        } else {
          encode(e.data.buf);
        }
        break;
      case "finish":
        finish();
        break;
    }
  };
})();
