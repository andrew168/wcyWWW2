/**
 * Created by Andrewz on 6/25/2016.
 */

function DataService(list) {
    var IMAGE_COLUMN_NUMBER = 3;
    var THUMBAIL_EXP = "w_100,h_100/";
    var vm = this,
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

    // implementations (按照字母顺序排列，升序)
    function fixup(props_local) {
        var i;
        for (i = 0; i < props_local.length; i++) {
            props_local[i].path = TQ.RM.toFullPathFs(toThumbNail(props_local[i].path));
        }
    }

    function getPage(step) {
        updatePageID(step);
        if (pages.length < 1) {
            return null;
        }
        return pages[currentPageID];
    }

    function prepareColumn(props_local, m) {
        var i,
            result = [],
            row = [],
            page = [];
        for (i = 0; i < props_local.length; i += m) {
            for (j = 0; j < m; j++) {
                if (i + j < props_local.length) {
                    row.push(props_local[i + j]);
                } else {
                    row.push(null);
                }
            }

            page.push(row);
            row = [];
            if (page.length >= 3) {
                result.push(page);
                page = [];
            }
        }

        if (page.length > 0) {
            result.push(page);
        }

        return result;
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
        if (TQ.Config.LocalCacheEnabled) {
            TQ.DownloadManager.downloadBulk(list);
        } else {
            fixup(list);
        }
        pages = prepareColumn(list, IMAGE_COLUMN_NUMBER);
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
