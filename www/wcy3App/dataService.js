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
        var IMAGE_COLUMN_NUMBER = 3,
            EVENT_DATA_READY = "data ready";
        var READY_BKG_IMAGE = 0x01,
            READY_PROP_IMAGE = 0x02,
            READY_PEOPLE_IMAGE = 0x04,
            READY_SOUND = 0x08,
            READY_OPUS = 0x10,
            READ_ALL = 0x1f;
        var state = 0,
            workCounter = 0;

        //在手机上，图片必须使用相对路径， 不能使用绝对路径！！！
        var propsLocal = new TQ.DataObject([
            {name: '道具', path: 'v1462412871/c161.jpg'},
            {name: '道具', path: 'v1462418136/c162.png'}
        ]);

        var propsAlbum = new TQ.DataObject();

        var propsCamera = new TQ.DataObject();

        var propsPeople = new TQ.DataObject([
            {name: '人物', path: 'p12504.png'}
        ]);

        var propsBackground = new TQ.DataObject([
            {name: '背景1', path: 'p12504.png'},
            {name: '背景2', path: 'v1453298300/67.jpg'}
        ]);

        var sounds = new TQ.DataObject([
            {name: '测试声音Clound', path: 'v1465523220/c0.mp3'},
            {name: '测试声音Clound', path: 'v1465523220/c0.mp3'},
            {name: '测试声音Clound', path: 'v1465523220/c0.mp3'}
        ]);

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

        function addWork(tag, wcyName, screenshot) {
            TQ.AssertExt.depreciated("deleteWork");
            var work = {tag: tag, wcyName: wcyName, path: screenshot, modified: true};
            var id = search(work);
            if (id >= 0) {
                temp = propsMyWork1.splice(id, 1);
                delete(temp.wcyName);
                delete(temp.path);
            }
            propsMyWork1.splice(0, 0, work);
            propsMyWork = TQ.DataService.prepareColumn(propsMyWork1, IMAGE_COLUMN_NUMBER);
            writeCache(MY_WORKS, propsMyWork1);
        }

        function deleteWork(work) {
            TQ.AssertExt.depreciated("deleteWork");
            var id = propsMyWork1.indexOf(work);
            if (id >= 0) {
                propsMyWork1.splice(id, 1);
            }
            writeCache(MY_WORKS, propsMyWork1);
            propsMyWork = TQ.DataService.prepareColumn(propsMyWork1, IMAGE_COLUMN_NUMBER);
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
                default :
                    console.error('资源类别参数错误');
                    return propsLocal.getPage(pageStep);
            }
        }

        function getSounds(pageStep) {
            return sounds.getPage(pageStep);
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
                getOpusList(propsMyWork, READY_OPUS);
            }
        }

        function getMatList(mats, matType, stateType) {
            $http({
                method: 'GET',
                url: TQ.Config.MAN_HOST + '/material/list/' + matType
            }).then(onSuccess);

            function onSuccess(response) {
                var data = (response.status === 200) ? response.data : [];
                if (!Array.isArray(data)) {
                    data = [];
                }
                mats.setList(data);
                state |= stateType;
                if (state === READ_ALL) {
                    onDataReady();
                }
            }
        }

        function getOpusList(mats, stateType) {
            $http({
                method: 'GET',
                url: TQ.Config.OPUS_HOST + '/wcyList/'
            }).then(onSuccess);

            function onSuccess(response) {
                var data = (response.status === 200) ? response.data : [],
                    selected = [];

                if (!Array.isArray(data)) {
                    data = [];
                }

                data.forEach(function(item) {
                    selected.push({wcyId: item._id, path: item.ssPath});
                });
                mats.setList(selected);
                state |= stateType;
                if (state === READ_ALL) {
                    onDataReady();
                }
            }
        }

        function onDataReady() {
            propsMyWork1 = readCacheWithParse(MY_WORKS, []);
            workCounter = readCacheWithParse("workCounter", 0);
            $rootScope.$broadcast(EVENT_DATA_READY);
        }

        function reload() { // 用于 登录之后的刷新
            onMatChanged();
        }

        return {
            EVENT_DATA_READY: EVENT_DATA_READY,
            initialize: initialize,
            getProps: getProps,
            getSounds: getSounds,
            addWork: addWork,
            deleteWork: deleteWork,
            cloneWork: cloneWork,
            generateUUID: generateUUID,
            reload: reload,
            toScreenshotName: toScreenshotName,
            toWcyName: toWcyName
        };
    }
})();
