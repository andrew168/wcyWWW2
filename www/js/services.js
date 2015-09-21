angular.module('starter')
    .factory("GetWcy", function($http, $localStorage) {
        function test() {
            // var filename = "p12853.wdm";
            // var filename = "p12585.wdm"; // Bear
            // var filename = "p14959.wdm"; // straw berry
            var filename = "p14961.wdm"; // 比例变换测试
            var content = null;
            var url = 'http://bone.udoido.cn/wcy/wdmOpen?filename=' + filename;
            content = $localStorage.testScene;
            if (!content) {
                $http.get(url, {})
                    .success(function (data, status, headers, config) {
                        console.log(data);
                        content = $localStorage.testScene = JSON.stringify(data);
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
            initCreateEnvironment(TQ.WCY.isPlayOnly);
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
    })
