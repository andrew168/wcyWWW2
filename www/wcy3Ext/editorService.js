/**
 * Created by Andrewz on 1/17/2016.
 * EditorExt service 是 SceneEditor的扩展，
 * * 可以调用更多的模块（比editor）， 比如图片上传模块
 * *
 */

angular.module('starter').
    factory('EditorService', ['NetService', function (NetService) {
        var _initialized = false;
        var fileElement = null;
        function insertLocalImage() {
            if (!_initialized) {
                _initialized = true;
                fileElement = $('#file_input');
            }

            fileElement.unbind('change'); // remove old handler
            fileElement[0].value = null;  // remove old selections
            fileElement.change(onSelectOne);
            fileElement.click();
        }

        function onSelectOne() {
            console.log('changed');
            var files = document.getElementById('file_input').files;
            if (files.length > 0 ) {
                uploadOneFile(files[0]).
                    then(function(data){
                        console.log(data);
                        var desc = {src: data.url, type: "Bitmap"};
                        TQ.SceneEditor.addItem(desc);
                        fileElement.unbind('change'); // remove old handler
                    }, function(err) {
                        console.log(err);
                    });
            }
        }

        function uploadOneFile(file) {
            return NetService.uploadOneImage(file);
        }

        return {
            insertLocalImage: insertLocalImage
        };
}]);
