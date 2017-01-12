/**
 * Created by Andrewz on 6/25/2016.
 */

function DataService(list) {
    var IMAGE_COLUMN_NUMBER = 3,
        THUMBAIL_EXP = "w_100,h_100/",
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
        var page = null,
            row = null;

        if (pages.length >= 1 ) {
            pages.splice(1, pages.length - 1);
            page = pages[0];
        } else {
            page = createPage();
        }

        if (page.length >= 1) {
            page.splice(1, page.length - 1);
            row = page[0];
            row.splice(0);
        } else {
            row = [];
            page.push(row);
        }

        for (var i = 0; i < IMAGE_COLUMN_NUMBER; i++) {
            row.push(null);
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
                    items[i].thumbPath = TQ.RM.toFullPathFs(toThumbNail(items[i].path));
                    items[i].path = TQ.RM.toFullPathFs(items[i].path);
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
            page = pages[pages.length - 1],
            row = page[page.length - 1];

        if (row[0] === null) {
            row.splice(0);
        } else if (row[2] === null) {
            TQ.AssertExt.invalidLogic(false, "已经有了搜索结果， 为什么要再执行到此？");
            row.splice(0);
        }

        for (i = 0; i < props_local.length;) {
            if (row.length >= 3) {
                row = [];
                if (page.length >= 3) {
                    page = createPage();
                }
                page.push(row);
            }

            for (j = 0; j < m; j++, i++) {
                if (i < props_local.length) {
                    row.push(props_local[i]);
                } else {
                    row.push(null);
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
        return  THUMBAIL_EXP + path;
    }

    function fromThumbNail(path) {
        return path.replace(THUMBAIL_EXP, "");
    }
}

TQ.DataObject = DataService;
