/**
 * Created by admin on 12/4/2015.
 */
var mongoose = require("mongoose");
var Schema = mongoose.Schema;

// 播放展示的记录（presentation）： XX时间，XX用户，打开了XX宣传（YY用户-XX防伪码-分享的XX作品），停留XX秒
// 在XX OS， XX设备上，
var showSchema = new Schema({
  timestamp: { type: Date, default: Date.now },
  // userId:Schema.ObjectId,
  // distributionId:Schema.ObjectId,
  duration: Number, // 秒s， 停留时间
  os: String, // 操作系统ID
  deviceId: String, // 设备型号
  _id: Number
}, { _id: false }); // , {collection: 'presentation', _id:true}

function setup(autoIncrement) {
  showSchema.plugin(autoIncrement, { id: "show_id", inc_field: "_id" });
  mongoose.model("Show", showSchema);
}

exports.setup = setup;
