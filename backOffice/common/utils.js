/**
 * Created by admin on 12/5/2015.
 */
var createTimestamp = function () {
    return parseInt(new Date().getTime() / 1000) + '';
};

/*
shareCode包括3个信息： 本次分享的唯一编号, 哪一个作品， 谁分享的， 什么时候，
  例如：
  100_12345678_123_1234567890
 */
function composeShareCode(shareId, wcyId, userId, timestamp) {
    return shareId + '_' + wcyId + '_' + userId + '_' + timestamp;
}

function decomposeShareCode(shareCode) {
    var values = shareCode.split('_');
    if (!values || values.length !== 4) {
        console.log("错误的分享代号");
    }
    return {shareId: values[0],
        wcyId: values[1],
        userId: values[2],
        timestamp: values[3]
    };
}

// 这个文件的名字就是类的名字，exports的所有输出都是这个类的公共接口函数
// 所有， 不需要在额外建立一个同名的Object，（因为， Node已经自动为我们做了）
exports.createTimestamp = createTimestamp;
exports.composeShareCode = composeShareCode;
exports.decomposeShareCode = decomposeShareCode;