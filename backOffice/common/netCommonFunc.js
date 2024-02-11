/**
 * Created by Andrewz on 4/30/2017.
 * network, http的通用操作函数
 */

function invalidOperation(req, res) {
  res.json("invalid operation: " + req.url);
}

function notLogin(req, res) {
  res.json("please login: " + req.url);
}

exports.invalidOperation = invalidOperation;
exports.notLogin = notLogin;
