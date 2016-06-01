/**
 * Created by Andrewz on 1/17/2016.
 * EditorExt service 是 SceneEditor的扩展，
 * * 可以调用更多的模块（比editor）， 比如图片上传模块
 * *
 */

angular.module('starter').
    factory('EditorService', ['NetService', 'WxService', function (NetService, WxService) {
        var _initialized = false,
            fileElement = null,
            _isBkMat = false,
            domEle = null;

        function insertBkMatFromLocal() {
            _isBkMat = true;
            return insertMatFromLocal(_isBkMat);
        }
		function insertMatFromLocal(isBkMat) {
            _isBkMat = !!isBkMat;
            if (WxService.isReady()) {
                alert("请在浏览器中打开，以便于使用所有功能");
                // return insertLocalMatWx();
            }

            return insertLocalMatWeb();
        }

        function insertLocalMatWeb() {
            if (!_initialized) {
                _initialized = true;
                domEle = document.createElement('input');
                domEle.setAttribute('id', '---input-file-test');
                domEle.setAttribute('type', 'file');
                domEle.setAttribute('multiple', true);
                document.body.appendChild(domEle);
                fileElement = $(domEle);
            }

            fileElement.unbind('change'); // remove old handler
            fileElement[0].value = null;  // remove old selections
            fileElement.change(onSelectOne);
            fileElement.click();
        }

        function onSelectOne() {
            console.log('changed');
            var files = domEle.files;
            if (files.length > 0 ) {
                processOneMat(files[0]);
            }
        }

        function processOneMat(aFile) {
            var wxAbility = {
                FileAPI: !!window.FileAPI,
                FileReader: !!window.FileReader,
                URL: !!window.URL,
                XMLHttpRequest: !!window.XMLHttpRequest,
                Blob: !!window.Blob,
                ArrayBuffer: !!window.ArrayBuffer,
                webkitURL: !!window.webkitURL,
                atob: !!window.atob
            };

            TQ.Log.alertInfo("before uploadOne:" + JSON.stringify(wxAbility));

            var matType = isSound(aFile) ? TQ.ElementType.SOUND : TQ.ElementType.BITMAP;
            var fitFlag = (_isBkMat && matType === TQ.ElementType.BITMAP) ?
                TQ.Element.FitFlag.FULL_SCREEN : TQ.Element.FitFlag.KEEP_SIZE;

            function uploadData(buffer) {
                uploadOneFile(buffer).
                    then(function (data) {
                        TQ.Log.alertInfo("after uploadOneFIle: " + JSON.stringify(data));
                        var desc = {src: data.url, type: matType, autoFit: fitFlag};
                        TQ.SceneEditor.addItem(desc);
                        // fileElement.unbind('change'); // remove old handler
                    }, function (err) {
                        console.log(err);
                    });
            }

            if (isSound(aFile)) {
                uploadData(aFile);
            } else {
                var options = {};
                var processor = new TQ.ImageProcess();
                processor.start(aFile, options, uploadData);
            }
        }

        // private functions:
        function isSound(file) {
            if (!file.type) {  // for Wx
                return false;
            }

            return (file.type.indexOf('audio') >= 0);
        }

        function insertLocalMatWx() {
            WxService.chooseImage().then(function(filePath) {
                var aFile = {
                    path: filePath,
                    type: NetService.TYPE_IMAGE,
                    isWx: true
                };

                TQ.Log.alertInfo("微信InsertLocal：" + JSON.stringify(aFile));
                processOneMat(aFile);
            }, function(err) {
                console.log(err);
            });

        }

        function uploadOneFile(file) {
            return NetService.uploadOne(file);
        }

        function insertImage(filename, x, y) {
            var desc = {src: filename, type: "Bitmap", x: x, y: y};
            TQ.SceneEditor.addItem(desc);
        }

        function insertText(message, x, y) {
            var desc = {src: null, text: message, type: "Text", x: x, y: y};
            TQ.SceneEditor.addItem(desc);
            // TQ.TextEditor.initialize();
            // TQ.TextEditor.addText(TQ.Dictionary.defaultText);
        }

        function insertSound(filename, x, y) {
            var desc = {src: filename, type: "Sound", x: x, y: y};
            TQ.SceneEditor.addItem(desc);
        }

        return {
            insertBkImageFromLocal: insertBkMatFromLocal,
            insertImageFromLocal: insertMatFromLocal,
            insertImage : insertImage,  // i.e. insertImageFromUrl:
            insertText : insertText,
            insertSound : insertSound
        };
}]);
