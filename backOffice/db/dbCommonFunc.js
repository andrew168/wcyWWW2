/**
 * Created by Andrewz on 4/29/2017.
 * 数据库的通用操作函数
 */

function setProp(operator, model, id, propName, propValue, callback) {
    var onlyMine = {userId: operator.ID},
        condition = {$and: [{_id: id}]};

    if (operator.canAdmin || operator.canBan || operator.canApprove) {// 如果 有权admin或Ban， 不加 userId的限制
    } else {
        condition.$and.push(onlyMine);
    }

    model.findOne(condition).exec(function (err, data) {
        if (err || !data) {
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

function ban(matModel, id, user, newValue, callback) {
    var onlyMine = {userId: user.ID},
        condition = {$and: [{_id: id}]};

    if (user.canAdmin || user.canBan) {// 如果 有权admin或Ban， 不加 userId的限制
    } else {
        condition.$and.push(onlyMine);
    }

    matModel.findOne(condition)
        .exec(function (err, data) {
            if (!data) {
                callback({error: 'not found! : ' + id + ", or not belong to this user: "});
            } else {
                console.log(data);
                if (newValue['isBanned'] !== undefined) {
                    data.set('isBanned', newValue['isBanned']);
                }

                if (newValue['isShared'] !== undefined) {
                    data.set('isShared', newValue['isShared']);
                }

                if (newValue['requestToBan'] !== undefined) {
                    data.set('requestToBan', newValue['requestToBan']);
                }

                if (newValue['requestToShare'] !== undefined) {
                    data.set('requestToShare', newValue['requestToShare']);
                }

                data.save(function (err, data) {
                    if (!err) {
                        if (callback) {
                            callback(data._doc._id);
                        }
                    } else {
                        callback({error: "error in ban picture mat!"});
                    }
                });
            }
        });
}

exports.ban = ban;
exports.composeErrorMsg = composeErrorMsg;
exports.setProp = setProp;
exports.updateDate = updateDate;
