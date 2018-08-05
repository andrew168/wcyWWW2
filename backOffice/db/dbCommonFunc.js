/**
 * Created by Andrewz on 4/29/2017.
 * 数据库的通用操作函数
 */

var STATE = {
    PRIVATE: 10,
    APPLY_TO_PUBLISH: 20, // 必须经过批准才能公开， 防止 出乱子，
    PUBLISHED: 30, //
    FINE: 40, // 优秀作品
    BAN: 70
};

function setProp(model, id, propName, propValue, callback) {
    model.findOne({_id: id})
        .exec(function (err, data) {
            if (err) {
                console.error(404, {msg: 'not found! : ' + id});
                if (callback) {
                    callback(-1);
                }
            } else {
                console.log(data);
                data.set(propName, propValue);
                data.save(function (err, data) {
                    if (!err) {
                        if (callback) {
                            callback(data._doc._id);
                        }
                    } else {
                        console.error("error in set Prop: " + propName);
                    }
                });
            }
        });
}

function composeErrorMsg(err, extraMsg) {
    var msg = (err ? ('db error, err = ' + err.toString()) :  '未找到记录');

    if (extraMsg) {
        msg += ", \t data = " + extraMsg.toString();
    }

    console.error(msg);
    return msg;
}

function updateDate(dataModel, newObj) {
    for (var prop in newObj) {
        if (newObj.hasOwnProperty(prop) && (prop !== '_id')) {
            dataModel.set(prop, newObj[prop]);
        }
    }
}

exports.STATE = STATE;
exports.composeErrorMsg = composeErrorMsg;
exports.setProp = setProp;
exports.updateDate = updateDate;
