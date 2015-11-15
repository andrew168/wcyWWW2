angular.module('starter')
    .factory("WCY", ['$http', 'FileService',
        function($http, FileService) {
            var _AUTO_SAVE_NAME = '_auto_save_name_';
            var _FILENAME = '_filename_';
            var readCache = TQ.Base.Utility.readCache;
            var writeCache = TQ.Base.Utility.writeCache;

            function create(option) {
                TQ.SceneEditor.createScene(option);
                startAutoSave();
            }

            function save() {
                TQ.Assert.isObject(currScene);
                var data = currScene.getData();
                data = new Blob([data], {type: 'text/plain'});
                var fileName = TQ.Config.WORKS_CORE_PATH + "nn.wcy";
                FileService.saveFile(fileName, data,
                    function onSuccess(e) {
                        TQ.Log.info(fileName + " saved");
                        currScene.isSaved = true;
                    },
                    function onError(e) {
                        TQ.Log.error("出错：无法保存文件: " + fileName + JSON.stringify(e));
                    });
            }

            function edit(sceneID) {
                TQ.WCY.isPlayOnly = false;
                return _load(sceneID);
            }

            function show(sceneID) {
                TQ.WCY.isPlayOnly = true;
                return _load(sceneID);
            }

            function start(wcyCacheName) {
                if (!wcyCacheName) {
                    wcyCacheName = _AUTO_SAVE_NAME;
                }
                var previousSaved = readCache(wcyCacheName);
                if (previousSaved) {
                    var filename = readCache(_FILENAME);
                    var fileInfo = {name:filename , content: previousSaved};
                    _open(fileInfo);
                } else {
                    create();
                }
            }

            // private function:
            function _load(sceneID) {
                var filename = "p14959.wdm"; // straw berry
                var content = null;

                if (sceneID) {
                    filename = 'p' + sceneID + '.wdm';
                }

                var url = 'http://bone.udoido.cn/wcy/wdmOpen?filename=' + filename;
                if (!content) {
                    $http.get(url, {})
                        .success(function (data, status, headers, config) {
                            console.log(data);
                            content = JSON.stringify(data);
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
                TQ.SceneEditor.openWcy(fileinfo);
                initToolbar();
                TQ.floatToolbar.initialize();
                TQ.floatToolbar.isVisible();
                startAutoSave();
            }

            function _autoSave() {
                if (_autoSaveStopped || currScene.isSaved) {
                    return;
                }

                TQ.Assert.isObject(currScene);
                var data = currScene.getData();
                writeCache(_AUTO_SAVE_NAME, data);
                writeCache(_FILENAME, currScene.filename);
            }

            var _autoSaveInitialized = false;
            var _autoSaveStopped = true;
            var _autoSavingInterval;
            function startAutoSave() {
                if (_autoSaveInitialized) {
                    _stopAutoSave();
                }
                _autoSaveInitialized = true;
                _autoSaveStopped = false;
                _autoSavingInterval = setInterval(_autoSave, 2000);
            }

            function _stopAutoSave() {
                if (_autoSavingInterval) {
                    _autoSaveStopped = true;
                    clearInterval(_autoSavingInterval);
                    _autoSavingInterval = null;
                }
            }

            return {
                start: start,  // start a new one, or load previous one (edited or played)
                create: create,
                save: save,
                edit: edit,  // open for edit
                show: show,  // open for show only

                // old api will be depreciated
                test: show,
                createScene: create
            };
        }]);
