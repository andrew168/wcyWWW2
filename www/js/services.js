angular.module('starter')
    .factory("GetWcy", ['$http', '$localStorage',
        function($http, $localStorage) {
        function test(sceneID) {
            var filename = "p14959.wdm"; // straw berry
            var content = null;

            if (sceneID) {
                filename = 'p' + sceneID + '.wdm';
            }

            var url = 'http://bone.udoido.cn/wcy/wdmOpen?filename=' + filename;
            content = $localStorage[filename];
            if (!content) {
                $http.get(url, {})
                    .success(function (data, status, headers, config) {
                        console.log(data);
                        content = $localStorage[filename] = JSON.stringify(data);
                        var fileInfo = {name: filename, content: content};
                        showWcy(fileInfo);
                    }).error(function (data, status, headers, config) {
                        console.log(data);
                    });
            } else {
                var fileInfo = {name: filename, content: content};
                showWcy(fileInfo);
            }
        }

        function showWcy(fileinfo) {
            $("#Container").css("width", TQ.Config.validPageWidth.toString() + "px");
            // setStageSize(600, 480);
            TQ.WCY.isPlayOnly = true;
            //ToDo:@UI  initCreateEnvironment(TQ.WCY.isPlayOnly);
            TQ.SceneEditor.showWcy(fileinfo);
            TQ.floatToolbar.initialize();
            TQ.floatToolbar.isVisible();
        }

        function testCreateScene() {
            TQ.SceneEditor.createScene();
        }

        return {
            test: test,
            testCreateScene: testCreateScene,
            showWcy: showWcy
        };
    }]);
