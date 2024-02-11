/**
 * Created by Andrewz on 7/4/2016.
 */
/**
 * Created by admin on 12/5/2015.
 */
var cSignature = require("./cloundarySignature"); // 后缀.js可以省略，Node会自动查找，

function screenshotId2Name(id) {
  return "s" + id;
}

function screenshotName2Id(name) {
  return Number(name.substr(1));
}

function responseImageId(res, id) {
  var data = {
    public_id: id
  };
  res.send(data);
}

function responseImageIdSigned(res, id) {
  var data = {
    public_id: id
  };
  cSignature.sign(data);
  res.send(data);
}

exports.screenshotName2Id = screenshotName2Id;
exports.screenshotId2Name = screenshotId2Name;
exports.responseImageId = responseImageId;
exports.responseImageIdSigned = responseImageIdSigned;
