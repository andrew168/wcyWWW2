/**
 * Created by admin on 10/3/2015.
 * Data Service： 从 network获取素材，提供给系统使用。避免重复network传输
 * 共用于 播放和创作
 */

(function() {
    angular.module('starter').factory('DataService', DataService);
    DataService.$injection = ['$http', 'NetService'];

    function DataService($http, NetService) {
        var readCacheWithParse = TQ.Base.Utility.readCacheWithParse;
        var writeCache = TQ.Base.Utility.writeCache;
        var initialized = false;
        var MY_WORKS = "_myWorks_";
        var IMAGE_COLUMN_NUMBER = 3;
        var RESOURCE_LOCAL = 'local',
            RESOURCE_ALBUM = 'album',
            RESOURCE_CAMERA = 'camera',
            RESOURCE_PEOPLE = 'people',
            RESOURCE_BKG = 'background',
            RESOURCE_MY_WORK = "mywork";
        var READY_BKG_IMAGE = 0x01,
            READY_PROP_IMAGE = 0x02,
            READY_PEOPLE_IMAGE = 0x04,
            READY_SOUND = 0x08,
            READ_ALL = 0x0f;
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
                case RESOURCE_LOCAL:
                    return propsLocal.getPage(pageStep);
                case RESOURCE_ALBUM:
                    return propsAlbum.getPage(pageStep);
                case RESOURCE_CAMERA:
                    return propsCamera.getPage(pageStep);
                case RESOURCE_PEOPLE:
                    return propsPeople.getPage(pageStep);
                case RESOURCE_BKG:
                    return propsBackground.getPage(pageStep);
                case RESOURCE_MY_WORK:
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
            getMatList(propsBackground, NetService.TYPE_BKG_IMAGE, READY_BKG_IMAGE);
            getMatList(propsLocal, NetService.TYPE_PROP_IMAGE, READY_PROP_IMAGE);
            getMatList(propsPeople, NetService.TYPE_PEOPLE_IMAGE, READY_PEOPLE_IMAGE);
            getMatList(sounds, NetService.TYPE_SOUND, READY_SOUND);
        }

        function getMatList(mats, matType, stateType) {
            $http({
                method: 'GET',
                url: TQ.Config.MAN_HOST + '/material/list/' + matType
            }).then(onSuccess);

            function onSuccess(response) {
                var data = (response.status === 200) ? response.data : [];
                mats.setList(data);
                state |= stateType;
                if (state === READ_ALL) {
                    onDataReady();
                }
            }
        }

        function onDataReady() {
            propsMyWork1 = readCacheWithParse(MY_WORKS, []);
            workCounter = readCacheWithParse("workCounter", 0);
/*            if (TQ.Config.LocalCacheEnabled) {
                TQ.DownloadManager.downloadBulk(propsAlbum);
                TQ.DownloadManager.downloadBulk(propsCamera);
            } else {
                fixup(propsAlbum);
                fixup(propsCamera);
            }

            // 把图片数据准备成3*N数组，不足的填null
            propsAlbum = _prepareColumn(propsAlbum, IMAGE_COLUMN_NUMBER);
            propsCamera = _prepareColumn(propsCamera, IMAGE_COLUMN_NUMBER);
            propsMyWork = _prepareColumn(propsMyWork1, IMAGE_COLUMN_NUMBER);
*/
        }

        return {
            RESOURCE_LOCAL: RESOURCE_LOCAL,
            RESOURCE_ALBUM: RESOURCE_ALBUM,
            RESOURCE_CAMERA: RESOURCE_CAMERA,
            RESOURCE_PEOPLE: RESOURCE_PEOPLE,
            RESOURCE_BKG: RESOURCE_BKG,
            RESOURCE_MY_WORK: RESOURCE_MY_WORK,

            initialize: initialize,
            getProps: getProps,
            getSounds: getSounds,
            addWork: addWork,
            deleteWork: deleteWork,
            cloneWork: cloneWork,
            generateUUID: generateUUID,
            toScreenshotName: toScreenshotName,
            toWcyName: toWcyName
        };
    }
})();
