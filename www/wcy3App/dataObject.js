/**
 * Created by Andrewz on 6/25/2016.
 */

function DataService(list) {
    var IMAGE_COLUMN_NUMBER = 3,
        THUMBAIL_EXP = "w_100,h_100,c_limit/",
        vm = this,
        currentPageID = 0,
        pages = [];

    // interface
    vm.getPage = getPage;
    vm.setList = setList;
    DataService.fromThumbNail = fromThumbNail;
    DataService.prepareColumn = prepareColumn;

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
        pages.push(page);
        return page;
    }

    // implementations (按照字母顺序排列，升序)
    function fixup(items) {
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
                    items[i].thumbPath = TQ.RM.toFullPathFs(toThumbNail(oldPath));
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
        return pages[currentPageID];
    }

    function prepareColumn(props_local, m) {
        var i,
            j,
            page = pages[pages.length - 1];

        for (i = 0; i < props_local.length;) {
            if (page.length >= 9) {
                page = createPage();
            }

            for (j = 0; j < m; j++, i++) {
                if (i < props_local.length) {
                    if (page.indexOf(props_local[i]) < 0) {
                        page.push(props_local[i]);
                    }
                }
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

    function setList(list) {
        reset();
        if (TQ.Config.LocalCacheEnabled) {
            TQ.DownloadManager.downloadBulk(list);
        } else {
            fixup(list);
        }
        prepareColumn(list, IMAGE_COLUMN_NUMBER);
    }

    function toThumbNail(path) {
        TQ.Assert.isTrue(path[0] != '/', "not separator");
        return  (TQ.Utility.isImage(path) ? THUMBAIL_EXP: "") + path;
    }

    function fromThumbNail(path) {
        return path.replace(THUMBAIL_EXP, "");
    }
}

TQ.DataObject = DataService;
