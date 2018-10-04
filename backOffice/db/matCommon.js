/**
 * Created by Andrewz on 7/8/18.
 */

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
