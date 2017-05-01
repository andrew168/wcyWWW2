/**
 * Created by Andrewz on 4/30/2017.
 * network, http的通用操作函数
 */

function invalidOperation(req, res) {
    res.json("invalid operation: " + req.url)
}

exports.invalidOperation = invalidOperation;
