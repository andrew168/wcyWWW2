/**
 * Created by Andrewz on 1/1/18.
 * Cmd 系列的文件， 只是用于编辑， 不能用于播放器， 所以要分离
 */

TQ.CommandMgr.setTextProperty = function (ele, option) {
    if (ele && ele.isText()) {
        var oldOption = {},
            newOption = option;

        var keys = Object.keys(option),
            jsonObj = ele.jsonObj;
        keys.forEach(function (prop) {
            oldOption[prop] = jsonObj[prop];
        });

        if (option.toggleBold) {
            oldOption.toggleBold = option.toggleBold;
        }

        if (option.toggleItalic) {
            oldOption.toggleItalic = option.toggleItalic;
        }

        return new TQ.GenCommand(['setProperty', 'setProperty'], ele, newOption, oldOption);
    }

    return null;
};
