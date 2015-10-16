angular.module('starter')
    .factory("GetWcy", ['$http', '$localStorage',
        function($http, $localStorage) {
            function create() {
                TQ.SceneEditor.createScene();
            }

            function save() {

            }

            function edit(sceneID) {
                TQ.WCY.isPlayOnly = false;
                return _load(sceneID);
            }

            function show(sceneID) {
                TQ.WCY.isPlayOnly = true;
                return _load(sceneID);
            }

            // private function:
            function _load(sceneID) {
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
                            _open(fileInfo);
                        }).error(function (data, status, headers, config) {
                            console.log(data);
                        });
                } else {
                    var fileInfo = {name: filename, content: content};
                    _open(fileInfo);
                }
            }

            function _open(fileinfo) {
                $("#Container").css("width", TQ.Config.validPageWidth.toString() + "px");
                // setStageSize(600, 480);
                //ToDo:@UI  initCreateEnvironment(TQ.WCY.isPlayOnly);
                TQ.SceneEditor.showWcy(fileinfo);
                TQ.floatToolbar.initialize();
                TQ.floatToolbar.isVisible();
            }

            return {
                create: create,
                save: save,
                edit: edit,  // open for edit
                show: show,  // open for show only

                // old api will be depreciated
                test: show,
                testCreateScene: create
            };
        }]);
