/**
 * Created by Andrewz on 10/2/18.
 */

function process(req) {
  var isAudit = false,
    reqBody = req.body,
    newValues = {};

  if (reqBody.ban !== undefined) {
    newValues.isBanned = reqBody.ban;
    isAudit = true;
  }

  if (reqBody.share !== undefined) {
    newValues.isShared = reqBody.share;
    isAudit = true;
  }

  if (reqBody.requestToShare !== undefined) {
    newValues.requestToShare = reqBody.requestToShare;
    isAudit = true;
  }

  if (reqBody.requestToBan !== undefined) {
    newValues.requestToBan = reqBody.requestToBan;
    isAudit = true;
  }

  return {isAudit: isAudit,
    newValues: newValues,
    _id: reqBody._id};
}

exports.process = process;
