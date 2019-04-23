/**
 * Created by Andrewz on 6/25/2016.
 */

function DataObject(list) {
    var IMAGE_PAGE_SIZE = 6,
        SOUND_PAGE_SIZE = 4,
        vm = this,
        bakCurrentPageId = 0,
        currentPageId = 0,
        pages = [];

    // interface
    vm.getPage = getPage;
    vm.setList = setList;

    // init
    if (list) {
        // setList(list);
    }

    reset();

    function reset() {
        var page = null;

        if (pages.length >= 1 ) {
            pages.splice(1, pages.length - 1);
            page = pages[0];
        } else {
            page = createPage();
        }

        if (page.length >= 1) {
            page.splice(0);
        }

        currentPageId = 0;
    }

    function createPage() {
        var page = [];
        page.parent = vm;
        page.previousPage = getPreviousPage;
        page.nextPage = getNextPage;
        pages.push(page);
        return page;
    }

    // implementations (按照字母顺序排列，升序)
    function fixup(items, matType) {
        var i;
        for (i = 0; i < items.length; i++) {
            if (items[i].extra) {
              items[i].extra = JSON.parse(items[i].extra);
            }
            if (!items[i].isProxy) {
                var oldPath = (matType === TQ.MatType.TOPIC)? items[i].posterPicturePath :
                    items[i].path;
                if (oldPath === "/undefined") {
                    oldPath = null;
                }
                if (!oldPath) {
                    items[i].thumbPath = null;
                    items[i].path = null;
                } else {
                    if (TQ.Utility.isSoundResource(oldPath)) { //force to convert to mp3
                        oldPath = TQ.Utility.forceExt(oldPath, ".mp3");
                    } else if (!TQ.Utility.isImage(oldPath) && !TQ.Utility.isVideo(oldPath)) {
                        TQ.Log.error("Found unknown format:" + oldPath);
                    }
                    if (matType === TQ.MatType.OPUS) {
                        items[i].thumbPath = TQ.RM.toOpusThumbNailFullPath(oldPath);
                    } else {
                        items[i].thumbPath = TQ.RM.toMatThumbNailFullPath(oldPath);
                    }

                    items[i].path = TQ.RM.toFullPathFs(oldPath);
                }
            }
        }
    }

    function getPage(step) {
        updatePageId(step);
        if (pages.length < 1) {
            TQ.AssertExt.invalidLogic(false, "应该有初始值！");
            return null;
        }
        bakCurrentPageId = currentPageId;
        return pages[currentPageId];
    }

    function getPreviousPage() {
        return getPage(-1);
    }

    function getNextPage() {
        return getPage(1);
    }

    function prepareColumn(props_local, pageSize) {
        var i,
            page = pages[pages.length - 1];

        for (i = 0; i < props_local.length; i++) {
            if (page.length >= pageSize) {
                page = createPage();
            }

            if (page.indexOf(props_local[i]) < 0) {
                page.push(props_local[i]);
            }
        }
    }

    function updatePageId(step) {
        if (!step) {
            step = 0;
        }

        switch (step) {
            case -2:
                currentPageId = 0;
                break;
            case 2:
                currentPageId = pages.length;
                break;
            case -1:
            case 1:
                currentPageId += step;
                break;
            case 0:
            default :
                break;
        }

        currentPageId = TQ.MathExt.clamp(currentPageId, 0, pages.length - 1);
    }

    function setList(list, matType) {
        reset();
        if (TQ.Config.LocalCacheEnabled) {
            TQ.DownloadManager.downloadBulk(list);
        } else {
            fixup(list, matType);
        }
        prepareColumn(list, (matType === TQ.MatType.SOUND? SOUND_PAGE_SIZE: IMAGE_PAGE_SIZE));
        currentPageId = bakCurrentPageId;
        updatePageId();
    }
}

DataObject.IMAGE_PAGE_SIZE = 9;
TQ.DataObject = DataObject;
