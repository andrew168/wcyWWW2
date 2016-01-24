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
            domEle = null;

		function insertLocalMat() {
            if (WxService.isReady()) {
                return insertLocalMatWx();
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
            uploadOneFile(aFile).
                then(function (data) {
                    TQ.Log.alertInfo("after uploadOneFIle: " + JSON.stringify(data));
                    var type = isSound(aFile) ? TQ.ElementType.SOUND : TQ.ElementType.BITMAP;
                    var desc = {src: data.url, type: type, autoFit: true};
                    TQ.SceneEditor.addItem(desc);
                    // fileElement.unbind('change'); // remove old handler
                }, function (err) {
                    console.log(err);
                });
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

        return {
            insertLocalImage: insertLocalMat
        };
}]);
