/**
 * Created by Andrewz on 6/25/2016.
 */

function DataObject(list) {
    var IMAGE_PAGE_SIZE = 9,
        SOUND_PAGE_SIZE = 4,
        THUMBNAIL_EXP = "w_100,h_100,c_limit/",
        OPUS_THUMBNAIL_EXP = "w_180,h_180,c_limit/",
        vm = this,
        bakCurrentPageID = 0,
        currentPageID = 0,
        pages = [];

    // interface
    vm.getPage = getPage;
    vm.setList = setList;
    DataObject.fromThumbNail = fromThumbNail;

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

        currentPageID = 0;
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
            if (!items[i].isProxy) {
                if (!items[i].path) {
                    items[i].thumbPath = null;
                    items[i].path = null;
                } else {
                    var oldPath = items[i].path;
                    if (TQ.Utility.isSoundResource(oldPath)) { //force to convert to mp3
                        oldPath = TQ.Utility.forceExt(oldPath, ".mp3");
                    } else if (!TQ.Utility.isImage(oldPath)) {
                        TQ.Log.error("Found unknown format:" + oldPath);
                    }
                    if (matType === TQ.MatType.OPUS) {
                        items[i].thumbPath = TQ.RM.toFullPathFs(toOpusThumbNail(oldPath));
                    } else {
                        items[i].thumbPath = TQ.RM.toFullPathFs(toThumbNail(oldPath));
                    }

                    items[i].path = TQ.RM.toFullPathFs(oldPath);
                }
            }
        }
    }

    function getPage(step) {
        updatePageID(step);
        if (pages.length < 1) {
            TQ.AssertExt.invalidLogic(false, "应该有初始值！");
            return null;
        }
        bakCurrentPageID = currentPageID;
        return pages[currentPageID];
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

    function updatePageID(step) {
        if (!step) {
            step = 0;
        }

        switch (step) {
            case -2:
                currentPageID = 0;
                break;
            case 2:
                currentPageID = pages.length;
                break;
            case -1:
            case 1:
                currentPageID += step;
                break;
            case 0:
            default :
                break;
        }

        currentPageID = TQ.MathExt.clamp(currentPageID, 0, pages.length - 1);
    }

    function setList(list, matType) {
        reset();
        if (TQ.Config.LocalCacheEnabled) {
            TQ.DownloadManager.downloadBulk(list);
        } else {
            fixup(list, matType);
        }
        prepareColumn(list, (matType === TQ.MatType.SOUND? SOUND_PAGE_SIZE: IMAGE_PAGE_SIZE));
        currentPageID = bakCurrentPageID;
        updatePageID();
    }

    function toThumbNail(path) {
        TQ.Assert.isTrue(path[0] != '/', "not separator");
        return  (TQ.Utility.isImage(path) ? THUMBNAIL_EXP: "") + path;
    }

    function toOpusThumbNail(path) {
        TQ.Assert.isTrue(path[0] != '/', "not separator");
        return (TQ.Utility.isImage(path) ? OPUS_THUMBNAIL_EXP : "") + path;
    }

    function fromThumbNail(path) {
        return path.replace(THUMBNAIL_EXP, "").replace(OPUS_THUMBNAIL_EXP, "");
    }
}

DataObject.IMAGE_PAGE_SIZE = 9;
TQ.DataObject = DataObject;
