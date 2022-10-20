/**
 * Created by Andrewz on 11/11/18.
 * const shared between server and client,
 * synced from server to client by deployment tool
 */

var TQ = TQ || {};
TQ.OPUS_STATE = {
  PRIVATE: 10,
  APPLY_TO_PUBLISH: 20, // 必须经过批准才能公开， 防止 出乱子，
  PUBLISHED: 30, //
  FINE: 40, // 优秀作品
  BAN: 70
};

if (typeof exports === 'object') {
  exports.OPUS_STATE = TQ.OPUS_STATE;
}
