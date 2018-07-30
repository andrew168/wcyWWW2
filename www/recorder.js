(function(exports){
    //公共方法
    var Util = {
        //初始化
        init: function(){
            navigator.getUserMedia = navigator.getUserMedia ||
                                     navigator.webkitGetUserMedia ||
                                     navigator.mozGetUserMedia ||
                                     navigator.msGetUserMedia;

            window.AudioContext = window.AudioContext ||
                                  window.webkitAudioContext;
        },
        //日志
        log: function(){
            console.log.apply(console,arguments);
        }
    };
    //构造函数
    var Recorder = function(config){

        var _this = this;
        var stopped = true;
        config = config || {}; //初始化配置对象
        config.sampleRate = config.sampleRate || 44100; //采样频率，默认为44100Hz(标准MP3采样率)
        config.bitRate = config.bitRate || 128; //比特率，默认为128kbps(标准MP3质量)


        Util.init();

        if(navigator.getUserMedia){
            navigator.getUserMedia({
                audio: true //配置对象
            },
            function(stream){ //成功回调
                var context = new AudioContext(),
                    microphone = context.createMediaStreamSource(stream), //媒体流音频源
                    processor = context.createScriptProcessor(16384,1,1), //js音频处理器
                    successCallback, errorCallback;

                config.sampleRate = context.sampleRate;

                processor.onaudioprocess = function(event) {
                    if (stopped) {
                        Util.log('丢弃');
                        return;
                    }
                    //监听音频录制过程
                    var array = event.inputBuffer.getChannelData(0);
                    realTimeWorker.postMessage({cmd: 'encode', buf: array});
                };

                var realTimeWorker = new Worker('/worker.js'); //开启后台线程
                realTimeWorker.onmessage = function(e){ //主线程监听后台线程，实时通信
                    switch(e.data.cmd){
                        case 'init':
                            Util.log('初始化成功');
                            if(config.success){
                                config.success();
                            }
                            break;
                        case 'end':
                            if(successCallback){
                                var blob = new Blob(e.data.buf, { type: 'audio/mp3' });
                                successCallback(blob);
                                Util.log('MP3大小：' + blob.size + '%cB', 'color:#0000EE');
                            }
                            break;
                        case 'error':
                            Util.log('错误信息：' + e.data.error);
                            if(errorCallback){
                                errorCallback(e.data.error);
                            }
                            break;
                        default:
                            Util.log('未知信息：' + e.data);
                    }
                };
                //接口列表
                //开始录音
                _this.start = function(){
                    if(processor && microphone){
                        _this.reset();
                        microphone.connect(processor);
                        processor.connect(context.destination);
                        Util.log('开始录音');
                        stopped = false;
                    }
                };
                //结束录音
                _this.stop = function(){
                    if(processor && microphone){
                        microphone.disconnect();
                        processor.disconnect();
                        Util.log('录音结束');
                        stopped = true;
                    }
                };
                _this.close = function () {
                    if (!stopped) {
                        _this.stop();
                    }
                    if (microphone) {
                        var tracks = microphone.mediaStream.getAudioTracks();
                        tracks.forEach(function (track) {
                            track.stop();
                        });

                        // microphone.stop();
                        microphone = null;
                    }
                    if (processor) {
                        // processor.stop();
                        processor = null;
                    }

                    // stream.stop();
                    context.close(); // 关闭AudioContext并释放资源，以便于其它app使用声音设备
                };
                //获取blob格式录音文件
                _this.getBlob = function(onSuccess, onError){
                    successCallback = onSuccess;
                    errorCallback = onError;
                    realTimeWorker.postMessage({ cmd: 'finish' });
                };
                _this.reset = function () {
                    realTimeWorker.postMessage({cmd: 'reset'});
                };

                realTimeWorker.postMessage({
                    cmd: 'init',
                    config: {
                        sampleRate: config.sampleRate,
                        bitRate: config.bitRate
                    }
                });
            },
            function(error){ //失败回调
                var msg;
                switch(error.name || error.code){
                    case 'SecurityError':
                        msg = '安全错误，需要使用用https';
                        break;
                    case 'PermissionDeniedError':
                    case 'PERMISSION_DENIED':
                    case 'NotAllowedError':
                        msg = '用户拒绝访问麦克风';
                        break;
                    case 'NOT_SUPPORTED_ERROR':
                    case 'NotSupportedError':
                        msg = '浏览器不支持麦克风';
                        break;
                    case 'MANDATORY_UNSATISFIED_ERROR':
                    case 'MandatoryUnsatisfiedError':
                        msg = '找不到麦克风设备';
                        break;
                    default:
                        msg = '无法打开麦克风，异常信息: error.code= ' + error.code + ', error.name=' + error.name;
                        break;
                }
                Util.log(msg);
                if(config.error){
                    config.error(msg);
                }
            });
        }else{
            Util.log('当前浏览器不支持录音功能');
            if(config.fix){
                config.fix('当前浏览器不支持录音功能');
            }
        }

    };
    //模块接口
    exports.Recorder = Recorder;
})(window);


var TQ = TQ || {};
TQ.AudioRecorder = (function () {
    var STATE_UNKNOWN = 0,
        STATE_INITIALIZED = 1,
        STATE_STARTED = 2,
        STATE_PENDING = 3;
    var recorder,
        state = STATE_UNKNOWN,
        onStopCallback;

    return {
        get isPending() { return state === STATE_PENDING; },
        get isRecording() {return state === STATE_STARTED; },
        accept: accept,
        close: close,
        start: start,
        stop: stop
    };

    function init(onSuccess, onError) {
        recorder = new Recorder({
            sampleRate: 44100, //采样频率，默认为44100Hz(标准MP3采样率)
            bitRate: 128, //比特率，默认为128kbps(标准MP3质量)
            success: function () { // //成功回调函数
                state = STATE_INITIALIZED;
                console.log('录音设备初始化成功!');
                if (onSuccess) {
                    onSuccess();
                }
            },

            error: function (msg) { //失败回调函数
                alert(msg);
                if (onError) {
                    onError();
                }
            },
            fix: function (msg) { //不支持H5录音回调函数
                alert(msg);
                if (onError) {
                    onError();
                }
            }
        });
    }

    function start(callback, refreshUI) {
        if (state >= STATE_INITIALIZED) {
            if (state === STATE_STARTED) {//不能重复开始，但是，如果有pending的， 则忽略它
                return;
            }
            state = STATE_STARTED;
            onStopCallback = callback;
            recorder.start();
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
            return setTimeout(function () {
                stop();
            })
        }

        state = STATE_PENDING;
        if (!onStopCallback) {
            onStopCallback = defaultCallback;
        }

        recorder.stop();
        recorder.getBlob(onStopCallback);
        onStopCallback = null;
    }

    function accept() {
        if (state === STATE_STARTED) {
            stop();
        }
        recorder.close();
        state = STATE_UNKNOWN;
    }

    function defaultCallback(blob) {
        console.log("sound recorded: type = " + blob.type + ', size = ' + blob.size);
        var audio = document.createElement('audio');
        audio.src = URL.createObjectURL(blob);
        audio.controls = true;
        document.appendChild(audio);
    }
})();
