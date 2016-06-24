/**
 * Created by admin on 10/3/2015.
 * Data Service： 从 network获取素材，提供给系统使用。避免重复network传输
 * 共用于 播放和创作
 */

var TQ = TQ||{};
(function(){
    function dataService() {
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
        var workCounter = 0;

        //在手机上，图片必须使用相对路径， 不能使用绝对路径！！！
        var propsLocal = [
            {name: '道具', path: 'v1462412871/c161.jpg'},
            {name: '道具', path: 'v1462418136/c162.png'}
      /*
            {name: '道具', path: 'mcImages/p15371.png'},
            {name: '道具', path: 'mcImages/p15305.png'},
            {name: '道具', path: 'mcImages/p15301.png'},
            {name: '道具', path: 'mcImages/p15299.png'},
            {name: '道具', path: 'mcImages/p15279.png'},
            {name: '道具', path: 'mcImages/p15277.png'},
            {name: '道具', path: 'mcImages/p15273.png'},
            {name: '道具', path: 'mcImages/p15271.png'},
            {name: '道具', path: 'mcImages/p15269.png'},
            {name: '道具', path: 'mcImages/p15267.png'},
            {name: '道具', path: 'mcImages/p15265.png'},
            {name: '道具', path: 'mcImages/p15263.png'},
            {name: '道具', path: 'mcImages/p15261.png'},
            {name: '道具', path: 'mcImages/p15259.png'},
            {name: '道具', path: 'mcImages/p15311.png'},
            {name: '道具', path: 'mcImages/p15039.png'},
            // {name: '道具', path:'mcImages/p15333.png'},
            // {name: '道具', path:'mcImages/p15341.png'},
            {name: '道具', path: 'mcImages/p15339.png'}
*/
        ];

        var propsAlbum = [
        ];

        var propsCamera = [
        ];

        var propsPeople = [
            {name: '人物', path: 'p12504.png'}
/*            {name: "人物", path: 'mcImages/p15365.png'},
            {name: "人物", path: 'mcImages/p15297.png'},
            {name: "人物", path: 'mcImages/p15303.png'},
            {name: "人物", path: 'mcImages/p15353.png'},
//        {name:"人物", path:'mcImages/p15275.png'},
            {name: "人物", path: 'mcImages/p15291.png'},
            {name: "人物", path: 'mcImages/p15287.png'},
            {name: "人物", path: 'mcImages/p15285.png'},
            {name: "人物", path: 'mcImages/p15283.png'},
            {name: "人物", path: 'mcImages/p15295.png'},
            {name: "人物", path: 'mcImages/p15293.png'},
            {name: "人物", path: 'mcImages/p15289.png'},
            {name: "人物", path: 'mcImages/p15347.png'},
            {name: "人物", path: 'mcImages/p15345.png'},
            {name: "人物", path: 'mcImages/p15349.png'},
            //       {name:"人物", path:'mcImages/p15357.png'},
            {name: "人物", path: 'mcImages/p15343.png'}
*/
        ];

        //     {name: "人物1", path:"mcImages/tom1.png"},
        //     {name: "人物2", path:"mcImages/mimixiong1.png"},
        var propsBackground = [
            {name: '背景1', path: 'p12504.png'},
            {name: '背景2', path: 'v1453298300/67.jpg'}
/*            {name: '背景1', path: 'mcImages/p15329.png'},
            {name: '背景1', path: 'mcImages/p15315.png'},
            {name: '背景1', path: 'mcImages/p15323.png'},
            {name: '背景1', path: 'mcImages/p15325.png'},
            {name: '背景1', path: 'mcImages/p15317.png'},
            {name: '背景1', path: 'mcImages/p15313.png'},
            {name: '背景1', path: 'mcImages/p15321.png'},
            {name: '背景1', path: 'mcImages/p15319.png'}
            // {name: '背景1', path:'mcImages/p15327.png'},
            // {name: '背景1', path:'mcImages/p15043.png'}
*/
        ];
        var sounds = [
            {name: '测试声音Clound', path: 'v1465523220/c0.mp3'},
            {name: '测试声音Clound', path: 'v1465523220/c0.mp3'},
            {name: '测试声音Clound', path: 'v1465523220/c0.mp3'}
        ];

        var propsMyWork;
        var propsMyWork1 = [
            // tagname, path: screenshot path,  wcyPath,
        ];

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
            var work = {tag: tag, wcyName:wcyName, path:screenshot, modified:true};
            var id = search(work);
            if (id >=0 ) {
                temp = propsMyWork1.splice(id, 1);
                delete(temp.wcyName);
                delete(temp.path);
            }
            propsMyWork1.splice(0, 0, work);
            propsMyWork = _prepareColumn(propsMyWork1, IMAGE_COLUMN_NUMBER);
            writeCache(MY_WORKS, propsMyWork1);
        }

        function deleteWork(work) {
            var id = propsMyWork1.indexOf(work);
            if (id >= 0) {
                propsMyWork1.splice(id, 1);
            }
            writeCache(MY_WORKS, propsMyWork1);
            propsMyWork = _prepareColumn(propsMyWork1, IMAGE_COLUMN_NUMBER);
        }

        function cloneWork(work) {

        }

        function generateUUID() {
            var id = workCounter;
            workCounter ++;
            writeCache('workCounter', workCounter);
            return id;
        }

        function toWcyName(uuid) {
            return TQ.Config.WORKS_CORE_PATH + uuid + ".wcy";
        }

        function toScreenshotName(uuid) {
            return TQ.Config.SCREENSHOT_CORE_PATH + uuid + ".png";
        }

        function _prepareColumn(props_local, m) {
            var i;
            var result = [];
            var row;
            for (i = 0; i < props_local.length; i += m) {
                row = [];
                for (j = 0; j < m; j++) {
                    if (i + j < props_local.length) {
                        row.push(props_local[i + j]);
                    } else {
                        row.push(null);
                    }
                }

                result.push(row);
            }
            return result;
        }

        function fixup(props_local) {
            var i;
            for (i = 0; i < props_local.length; i++) {
                props_local[i].path = TQ.RM.toFullPathFs(props_local[i].path);
            }
        }

        function getProps(type) {
            switch (type) {
                case RESOURCE_LOCAL:
                    return propsLocal;
                case RESOURCE_ALBUM:
                    return propsAlbum;
                case RESOURCE_CAMERA:
                    return propsCamera;
                case RESOURCE_PEOPLE:
                    return propsPeople;
                case RESOURCE_BKG:
                    return propsBackground;
                case RESOURCE_MY_WORK:
                    return propsMyWork;
                default :
                    console.error('资源类别参数错误');
                    return propsLocal;
            }
        }

        function getSounds() {
            return sounds;
        }

        function initialize() {
            if (initialized) {
                return;
            }

            initialized = true;
            propsMyWork1 = readCacheWithParse(MY_WORKS, []);
            workCounter = readCacheWithParse("workCounter", 0);
            if (TQ.Config.LocalCacheEnabled) {
                TQ.DownloadManager.downloadBulk(propsLocal);
                TQ.DownloadManager.downloadBulk(propsAlbum);
                TQ.DownloadManager.downloadBulk(propsCamera);
                TQ.DownloadManager.downloadBulk(propsPeople);
                TQ.DownloadManager.downloadBulk(propsBackground);
            } else {
                fixup(propsLocal);
                fixup(propsAlbum);
                fixup(propsCamera);
                fixup(propsPeople);
                fixup(propsBackground);
            }

            // 把图片数据准备成3*N数组，不足的填null
            propsLocal = _prepareColumn(propsLocal, IMAGE_COLUMN_NUMBER);
            propsAlbum = _prepareColumn(propsAlbum, IMAGE_COLUMN_NUMBER);
            propsCamera = _prepareColumn(propsCamera, IMAGE_COLUMN_NUMBER);
            propsPeople = _prepareColumn(propsPeople, IMAGE_COLUMN_NUMBER);
            propsBackground = _prepareColumn(propsBackground, IMAGE_COLUMN_NUMBER);
            sounds = _prepareColumn(sounds, IMAGE_COLUMN_NUMBER);
            propsMyWork = _prepareColumn(propsMyWork1, IMAGE_COLUMN_NUMBER);
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
            cloneWork:cloneWork,
            generateUUID: generateUUID,
            toScreenshotName: toScreenshotName,
            toWcyName: toWcyName
        };
    }

    TQ.DataService = dataService();
})();
