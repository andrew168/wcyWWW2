/**
 * Created by admin on 10/3/2015.
 * Data Service： 从 network获取素材，提供给系统使用。避免重复network传输
 * 共用于 播放和创作
 */

(function() {
    angular.module('starter').factory('DataService', DataService);
    DataService.$inject = ['$rootScope', '$http'];
    function DataService($rootScope, $http) {
        var readCacheWithParse = TQ.Base.Utility.readCacheWithParse;
        var writeCache = TQ.Base.Utility.writeCache;
        var initialized = false;
        var MY_WORKS = "_myWorks_";
        var EVENT_TOPIC_READY = "topic ready",
            EVENT_DATA_READY = "data ready";
        var READY_BKG_IMAGE = 0x01,
            READY_PROP_IMAGE = 0x02,
            READY_PEOPLE_IMAGE = 0x04,
            READY_SOUND = 0x08,
            READY_OPUS = 0x10,
            READ_ALL = 0x1f;
        var state = 0,
            options = {
                requestAll: false
            },
            workCounter = 0;

        //在手机上，图片必须使用相对路径， 不能使用绝对路径！！！
        var propsLocal = new TQ.DataObject();

        var propsAlbum = new TQ.DataObject();

        var propsCamera = new TQ.DataObject();

        var propsPeople = new TQ.DataObject();

        var propsBackground = new TQ.DataObject();

        var sounds = new TQ.DataObject();
        var topics = new TQ.DataObject();

        var propsMyWork = new TQ.DataObject();
        var propsMyWork1 = new TQ.DataObject();

        function updateWork(work, tag, wcyName, screenshot) {
            work.tag = tag;
            work.filename = wcyName;
            work.screenshortName = screenshot;
        }

        function search(work) {
            for (var i = 0; i < propsMyWork1.length; i++) {
                if ((propsMyWork1[i].wcyName === work.wcyName) &&
                    (propsMyWork1[i].screenshortName === work.screenshotName)) {
                    return i;
                }
            }

            return -1;
        }

        function cloneWork(work) {

        }

        function generateUUID() {
            var id = workCounter;
            workCounter++;
            writeCache('workCounter', workCounter);
            return id;
        }

        function toWcyName(uuid) {
            return TQ.Config.WORKS_CORE_PATH + uuid + ".wcy";
        }

        function toScreenshotName(uuid) {
            return TQ.Config.SCREENSHOT_CORE_PATH + uuid + ".png";
        }

        function getProps(type, pageStep) {
            switch (type) {
                case TQ.MatType.SOUND:
                    return sounds.getPage(pageStep);
                case TQ.MatType.PROP:
                    return propsLocal.getPage(pageStep);
                case TQ.MatType.ALBUM:
                    TQ.AssertExt.depreciated("ALBUM");
                    return propsAlbum.getPage(pageStep);
                case TQ.MatType.CAMERA:
                    TQ.AssertExt.depreciated("CAMERA");
                    return propsCamera.getPage(pageStep);
                case TQ.MatType.PEOPLE:
                    return propsPeople.getPage(pageStep);
                case TQ.MatType.BKG:
                    return propsBackground.getPage(pageStep);
                case TQ.MatType.OPUS:
                    return propsMyWork.getPage(pageStep);
                case TQ.MatType.TOPIC:
                    return topics.getPage(pageStep);
                default :
                    console.error('资源类别参数错误');
                    return propsLocal.getPage(pageStep);
            }
        }

        function getSounds(pageStep) {
            return sounds.getPage(pageStep);
        }

        function getTopics(pageStep) {
            return topics.getPage(pageStep);
        }

        function loadTopics() {
            var url = TQ.Config.OPUS_HOST + "/topic/list";
            $http.get(url).then(function (response) {
                    console.log(response);
                    var data = (response.status === 200) ? response.data : [];
                    if (!Array.isArray(data)) {
                        data = [];
                    }
                    topics.setList(data, TQ.MatType.TOPIC);
                    $rootScope.$broadcast(EVENT_TOPIC_READY);
                },
                function (reason) {
                    console.log(reason);
                });
        }

        function initialize() {
            if (initialized) {
                return;
            }
            initialized = true;
            document.addEventListener(TQ.EVENT.MAT_CHANGED, onMatChanged, false);
            onMatChanged();
        }

        function onMatChanged(event) {
            if (!TQ.userProfile.loggedIn) {
                return;
            }

            var matType = null;
            if (!!event && event.data && event.data.matType) {
                matType = event.data.matType;
            }

            if (!matType || (matType === TQ.MatType.BKG)) {
                state &= (~READY_BKG_IMAGE);
                getMatList(propsBackground, TQ.MatType.BKG, READY_BKG_IMAGE);
            }

            if (!matType || (matType === TQ.MatType.PROP)) {
                state &= (~READY_PROP_IMAGE);
                getMatList(propsLocal, TQ.MatType.PROP, READY_PROP_IMAGE);
            }

            if (!matType || (matType === TQ.MatType.PEOPLE)) {
                state &= (~READY_PEOPLE_IMAGE);
                getMatList(propsPeople, TQ.MatType.PEOPLE, READY_PEOPLE_IMAGE);
            }
            if (!matType || (matType === TQ.MatType.SOUND)) {
                state &= (~READY_SOUND);
                getMatList(sounds, TQ.MatType.SOUND, READY_SOUND);
            }
            if (!matType || (matType === TQ.MatType.OPUS)) {
                state &= (~READY_OPUS);
                getOpusList(propsMyWork, matType, READY_OPUS);
            }
            loadTopics(); //只有后台admin工具需要。
        }

        function getMatList(mats, matType, stateType) {
            var topicId = TQ.Utility.getTopicId(),
                requestAll = (!topicId) || (topicId <=0) || options.requestAll;
            $http({
                method: 'GET',
                url: TQ.Config.MAN_HOST + '/material/list/' + matType + "/topic/" + topicId + "/option/" + requestAll
            }).then(onSuccess);

            function onSuccess(response) {
                var data = (response.status === 200) ? response.data : [];
                if (!Array.isArray(data)) {
                    data = [];
                }
                mats.setList(data, matType);
                state |= stateType;
                if (state === READ_ALL) {
                    onDataReady();
                }
            }
        }

        function getOpusList(mats, matType, stateType) {
            $http({
                method: 'GET',
                url: TQ.Config.OPUS_HOST + '/wcyList/'
            }).then(onSuccess);

            function onSuccess(response) {
                var data = (response.status === 200) ? response.data : [],
                    selected = [],
                    userName = TQ.userProfile.getUserName();

                if (!Array.isArray(data)) {
                    data = [];
                }

                data.forEach(function(item) {
                    var itemCopy = TQUtility.shadowCopy(item);
                    itemCopy.wcyId = item._id;
                    itemCopy.path = item.ssPath;
                    itemCopy.title = item.title || "我有一个梦"; // ToDo: 允许用户录入主题， 或系统设置竞赛的主题
                    itemCopy.score = (!item.score ? 1000 : item.score); //起点，（只有创作了作品，系统给你1000点， 然后实时统计
                    itemCopy.userAge = (!itemCopy.userAge) ? 8 : itemCopy.userAge;
                    itemCopy.city = TQ.userProfile.city;
                    selected.push(itemCopy);
                });
                mats.setList(selected, matType);
                state |= stateType;
                if (state === READ_ALL) {
                    onDataReady();
                }
            }
        }

        function onDataReady() {
            propsMyWork1 = readCacheWithParse(MY_WORKS, []);
            workCounter = readCacheWithParse("workCounter", 0);
            TQ.Log.checkPoint('DataService.EVENT_DATA_READY');
            $rootScope.$broadcast(EVENT_DATA_READY);
        }

        function reload() { // 用于 登录之后的刷新
            onMatChanged();
        }

        function setup(newOptions) {
            TQUtility.extendWithoutObject(options, newOptions);
        }

        return {
            EVENT_TOPIC_READY: EVENT_TOPIC_READY,
            EVENT_DATA_READY: EVENT_DATA_READY,
            initialize: initialize,
            setup: setup,
            getProps: getProps,
            getSounds: getSounds,
            getTopics: getTopics,
            cloneWork: cloneWork,
            generateUUID: generateUUID,
            loadTopics: loadTopics,
            reload: reload,
            toScreenshotName: toScreenshotName,
            toWcyName: toWcyName
        };
    }
})();
