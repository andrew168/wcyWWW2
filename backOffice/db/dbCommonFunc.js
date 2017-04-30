/**
 * Created by Andrewz on 4/29/2017.
 * 数据库的通用操作函数
 */

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

exports.setProp = setProp;
